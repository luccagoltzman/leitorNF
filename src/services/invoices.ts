import { supabase } from '../lib/supabase'
import { assertSession, assertSupabaseConfigured } from '../lib/requireAuth'
import type { InvoiceFilters, InvoiceWithItems, ParsedNfe } from '../types/nfe'
import { filterInvoices } from '../utils/invoiceFilters'
import { INVOICE_SELECT, mapInvoiceRow, mapInvoiceRows } from '../utils/invoiceMapper'
import {
  isPdfColumnMissing,
  isSchemaMissingError,
  PDF_COLUMN_HINT,
  BIDS_SCHEMA_HINT,
  SCHEMA_MISSING_HINT,
} from '../utils/supabaseErrors'
import {
  getSignedFileUrl,
  removeStoragePaths,
  uploadToStorage,
} from './storage'

const INVOICE_SELECT_FALLBACK = '*, invoice_items(*)'

function isBidsRelationMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  const msg = (e.message ?? '').toLowerCase()
  return (
    e.code === 'PGRST200' ||
    msg.includes('bids') ||
    msg.includes('bid_id') ||
    (msg.includes('relationship') && msg.includes('invoices'))
  )
}

async function queryInvoicesList(
  select: string,
  filters?: InvoiceFilters,
): Promise<{ data: InvoiceWithItems[] | null; error: unknown }> {
  let query = supabase
    .from('invoices')
    .select(select)
    .order('created_at', { ascending: false })

  if (filters?.dateFrom) {
    query = query.gte('data_emissao', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('data_emissao', `${filters.dateTo}T23:59:59`)
  }

  const { data, error } = await query
  return { data: data as InvoiceWithItems[] | null, error }
}

export async function isSupabaseSchemaReady(): Promise<boolean> {
  assertSupabaseConfigured()
  const { error } = await supabase
    .from('invoices')
    .select('id', { head: true, count: 'exact' })
  if (error && isSchemaMissingError(error)) return false
  return !error
}

/** Etapa 1: guarda XML, dados da NF e indexação (sem PDF ainda). */
export async function saveInvoiceFromXml(
  parsed: ParsedNfe,
  options: { userId: string; xmlFile: File; bidId?: string | null },
): Promise<InvoiceWithItems> {
  await assertSession()
  if (!options.userId) {
    throw new Error('Faça login para guardar notas no cofre do cliente.')
  }

  const userId = options.userId
  const xmlPath = await uploadToStorage(
    userId,
    options.xmlFile,
    options.xmlFile.name,
    'application/xml',
  )

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    numero_nf: parsed.numeroNf,
    serie: parsed.serie,
    chave_acesso: parsed.chaveAcesso || null,
    emitente: parsed.emitente.razaoSocial,
    emitente_cnpj: parsed.emitente.cnpj,
    destinatario: parsed.destinatario.nome,
    destinatario_doc: parsed.destinatario.documento,
    valor_total: parsed.totais.valorTotal,
    frete: parsed.totais.frete,
    desconto: parsed.totais.desconto,
    data_emissao: parsed.dataEmissao || null,
    natureza_operacao: parsed.naturezaOperacao,
    arquivo_url: xmlPath,
  }
  if (options.bidId) {
    insertPayload.bid_id = options.bidId
  }

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert(insertPayload)
    .select()
    .single()

  if (invoiceError) {
    await removeStoragePaths([xmlPath])
    if (isBidsRelationMissing(invoiceError) && options.bidId) {
      throw new Error(BIDS_SCHEMA_HINT)
    }
    throw invoiceError
  }

  const itemsPayload = parsed.produtos.map((p) => ({
    invoice_id: invoice.id,
    codigo: p.codigo,
    descricao: p.descricao,
    ncm: p.ncm,
    cfop: p.cfop,
    quantidade: p.quantidade,
    valor_unitario: p.valorUnitario,
    valor_total: p.valorTotal,
    icms: p.icms,
    ipi: p.ipi,
    pis: p.pis,
    cofins: p.cofins,
  }))

  const { data: items, error: itemsError } = await supabase
    .from('invoice_items')
    .insert(itemsPayload)
    .select()

  if (itemsError) {
    await removeStoragePaths([xmlPath])
    await supabase.from('invoices').delete().eq('id', invoice.id)
    throw itemsError
  }

  return mapInvoiceRow({
    ...invoice,
    invoice_items: items ?? [],
    pdf_url: invoice.pdf_url ?? null,
    bid_id: invoice.bid_id ?? null,
  })
}

/** Etapa 2: anexa o PDF original a uma nota já cadastrada. */
export async function attachPdfToInvoice(
  invoiceId: string,
  pdfFile: File,
  userId: string,
): Promise<InvoiceWithItems> {
  await assertSession()
  if (!userId) {
    throw new Error('Faça login para guardar o PDF no cofre.')
  }

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select(INVOICE_SELECT_FALLBACK)
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !invoice) {
    throw new Error('Nota não encontrada.')
  }

  if (invoice.pdf_url) {
    throw new Error('Esta nota já possui PDF guardado.')
  }

  const pdfPath = await uploadToStorage(
    userId,
    pdfFile,
    pdfFile.name,
    'application/pdf',
  )

  const { data: updated, error: updateError } = await supabase
    .from('invoices')
    .update({ pdf_url: pdfPath })
    .eq('id', invoiceId)
    .select(INVOICE_SELECT)
    .single()

  if (updateError) {
    await removeStoragePaths([pdfPath])
    if (isPdfColumnMissing(updateError)) {
      throw new Error(PDF_COLUMN_HINT)
    }
    const fallback = await supabase
      .from('invoices')
      .update({ pdf_url: pdfPath })
      .eq('id', invoiceId)
      .select(INVOICE_SELECT_FALLBACK)
      .single()
    if (fallback.error) throw fallback.error
    return mapInvoiceRow(fallback.data as InvoiceWithItems)
  }

  return mapInvoiceRow(updated as InvoiceWithItems)
}

export async function linkInvoiceToBid(
  invoiceId: string,
  bidId: string | null,
  userId?: string,
): Promise<InvoiceWithItems> {
  await assertSession()
  if (!userId) {
    throw new Error('Faça login para vincular notas à licitação.')
  }

  const { data, error } = await supabase
    .from('invoices')
    .update({ bid_id: bidId })
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .select(INVOICE_SELECT)
    .single()

  if (error) {
    if (isBidsRelationMissing(error)) {
      throw new Error(BIDS_SCHEMA_HINT)
    }
    throw error
  }
  return mapInvoiceRow(data as InvoiceWithItems)
}

export async function fetchInvoices(
  filters?: InvoiceFilters,
): Promise<InvoiceWithItems[]> {
  await assertSession()

  let result = await queryInvoicesList(INVOICE_SELECT, filters)
  let withBids = true
  if (result.error && isBidsRelationMissing(result.error)) {
    withBids = false
    result = await queryInvoicesList(INVOICE_SELECT_FALLBACK, filters)
  }
  if (result.error) {
    if (isSchemaMissingError(result.error)) {
      throw new Error(SCHEMA_MISSING_HINT)
    }
    throw result.error
  }

  const rows = withBids
    ? mapInvoiceRows(result.data ?? [])
    : (result.data ?? [])

  return filterInvoices(rows, filters)
}

export async function fetchInvoiceById(id: string): Promise<InvoiceWithItems> {
  await assertSession()

  const withBid = await supabase
    .from('invoices')
    .select(INVOICE_SELECT)
    .eq('id', id)
    .single()

  if (!withBid.error) {
    return mapInvoiceRow(withBid.data as InvoiceWithItems)
  }

  if (!isBidsRelationMissing(withBid.error)) {
    if (isSchemaMissingError(withBid.error)) {
      throw new Error(SCHEMA_MISSING_HINT)
    }
    throw withBid.error
  }

  const fallback = await supabase
    .from('invoices')
    .select(INVOICE_SELECT_FALLBACK)
    .eq('id', id)
    .single()

  if (fallback.error) {
    if (isSchemaMissingError(fallback.error)) {
      throw new Error(SCHEMA_MISSING_HINT)
    }
    throw fallback.error
  }
  return fallback.data as InvoiceWithItems
}

export async function getInvoiceFileUrls(invoice: InvoiceWithItems): Promise<{
  xmlUrl: string | null
  pdfUrl: string | null
}> {
  await assertSession()
  const [xmlUrl, pdfUrl] = await Promise.all([
    getSignedFileUrl(invoice.arquivo_url),
    getSignedFileUrl(invoice.pdf_url),
  ])
  return { xmlUrl, pdfUrl }
}

export async function deleteInvoice(id: string): Promise<void> {
  await assertSession()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('arquivo_url, pdf_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) {
    if (isSchemaMissingError(error)) {
      throw new Error(SCHEMA_MISSING_HINT)
    }
    throw error
  }

  if (invoice) {
    await removeStoragePaths([invoice.arquivo_url, invoice.pdf_url])
  }
}
