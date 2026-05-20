import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { InvoiceFilters, InvoiceWithItems, ParsedNfe } from '../types/nfe'
import { filterInvoices } from '../utils/invoiceFilters'
import {
  isPdfColumnMissing,
  isSchemaMissingError,
  PDF_COLUMN_HINT,
} from '../utils/supabaseErrors'
import * as local from './localInvoices'
import {
  getSignedFileUrl,
  removeStoragePaths,
  uploadToStorage,
} from './storage'

async function shouldUseLocalStorage(): Promise<boolean> {
  if (!isSupabaseConfigured) return true
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !session
}

export async function isSupabaseSchemaReady(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase
    .from('invoices')
    .select('id', { head: true, count: 'exact' })
  if (error && isSchemaMissingError(error)) return false
  return !error
}

/** Etapa 1: guarda XML, dados da NF e indexação (sem PDF ainda). */
export async function saveInvoiceFromXml(
  parsed: ParsedNfe,
  options: { userId: string; xmlFile: File },
): Promise<InvoiceWithItems> {
  if ((await shouldUseLocalStorage()) || !options.userId) {
    throw new Error('Faça login para guardar notas no cofre do cliente.')
  }

  const userId = options.userId
  const xmlPath = await uploadToStorage(
    userId,
    options.xmlFile,
    options.xmlFile.name,
    'application/xml',
  )

  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
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
    })
    .select()
    .single()

  if (invoiceError) {
    await removeStoragePaths([xmlPath])
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

  return { ...invoice, invoice_items: items ?? [], pdf_url: null }
}

/** Etapa 2: anexa o PDF original a uma nota já cadastrada. */
export async function attachPdfToInvoice(
  invoiceId: string,
  pdfFile: File,
  userId: string,
): Promise<InvoiceWithItems> {
  if ((await shouldUseLocalStorage()) || !userId) {
    throw new Error('Faça login para guardar o PDF no cofre.')
  }

  const { data: invoice, error: fetchError } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
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
    .select('*, invoice_items(*)')
    .single()

  if (updateError) {
    await removeStoragePaths([pdfPath])
    if (isPdfColumnMissing(updateError)) {
      throw new Error(PDF_COLUMN_HINT)
    }
    throw updateError
  }

  return updated as InvoiceWithItems
}

export async function fetchInvoices(
  filters?: InvoiceFilters,
): Promise<InvoiceWithItems[]> {
  if (await shouldUseLocalStorage()) {
    return local.fetchLocalInvoices(filters)
  }

  let query = supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .order('created_at', { ascending: false })

  if (filters?.dateFrom) {
    query = query.gte('data_emissao', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('data_emissao', `${filters.dateTo}T23:59:59`)
  }
  const { data, error } = await query
  if (error) {
    if (isSchemaMissingError(error)) {
      return local.fetchLocalInvoices(filters)
    }
    throw error
  }
  return filterInvoices((data ?? []) as InvoiceWithItems[], filters)
}

export async function fetchInvoiceById(id: string): Promise<InvoiceWithItems> {
  if (await shouldUseLocalStorage()) {
    return local.fetchLocalInvoiceById(id)
  }

  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    if (isSchemaMissingError(error)) {
      return local.fetchLocalInvoiceById(id)
    }
    throw error
  }
  return data as InvoiceWithItems
}

export async function getInvoiceFileUrls(invoice: InvoiceWithItems): Promise<{
  xmlUrl: string | null
  pdfUrl: string | null
}> {
  if (await shouldUseLocalStorage()) {
    return { xmlUrl: null, pdfUrl: null }
  }
  const [xmlUrl, pdfUrl] = await Promise.all([
    getSignedFileUrl(invoice.arquivo_url),
    getSignedFileUrl(invoice.pdf_url),
  ])
  return { xmlUrl, pdfUrl }
}

export async function deleteInvoice(id: string): Promise<void> {
  if (await shouldUseLocalStorage()) {
    local.deleteLocalInvoice(id)
    return
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('arquivo_url, pdf_url')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) {
    if (isSchemaMissingError(error)) {
      local.deleteLocalInvoice(id)
      return
    }
    throw error
  }

  if (invoice) {
    await removeStoragePaths([invoice.arquivo_url, invoice.pdf_url])
  }
}
