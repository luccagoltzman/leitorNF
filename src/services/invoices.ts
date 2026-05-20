import { isSupabaseConfigured, supabase } from '../lib/supabase'
import type { InvoiceFilters, InvoiceWithItems, ParsedNfe } from '../types/nfe'
import { isSchemaMissingError } from '../utils/supabaseErrors'
import * as local from './localInvoices'

const BUCKET = 'invoices'

async function shouldUseLocalStorage(): Promise<boolean> {
  if (!isSupabaseConfigured) return true
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !session
}

/** false = tabelas ainda não criadas (404 / PGRST205) */
export async function isSupabaseSchemaReady(): Promise<boolean> {
  if (!isSupabaseConfigured) return false
  const { error } = await supabase
    .from('invoices')
    .select('id', { head: true, count: 'exact' })
  if (error && isSchemaMissingError(error)) return false
  return !error
}

export async function uploadXmlToStorage(
  userId: string,
  file: File,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: 'application/xml',
    upsert: false,
  })
  if (error) throw error

  return path
}

export async function saveInvoiceFromParsed(
  parsed: ParsedNfe,
  options: { userId?: string; file: File },
): Promise<InvoiceWithItems> {
  if ((await shouldUseLocalStorage()) || !options.userId) {
    return local.saveLocalInvoice(parsed, options.file.name)
  }

  const arquivoUrl = await uploadXmlToStorage(options.userId, options.file)
  const userId = options.userId

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
      arquivo_url: arquivoUrl,
    })
    .select()
    .single()

  if (invoiceError) throw invoiceError

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

  if (itemsError) throw itemsError

  return { ...invoice, invoice_items: items ?? [] }
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
  if (filters?.search?.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(
      `numero_nf.ilike.${term},emitente.ilike.${term},chave_acesso.ilike.${term}`,
    )
  }

  const { data, error } = await query
  if (error) {
    if (isSchemaMissingError(error)) {
      console.warn('[Supabase] Tabelas não encontradas — usando dados locais.')
      return local.fetchLocalInvoices(filters)
    }
    throw error
  }
  return (data ?? []) as InvoiceWithItems[]
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

export async function deleteInvoice(id: string): Promise<void> {
  if (await shouldUseLocalStorage()) {
    local.deleteLocalInvoice(id)
    return
  }

  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) {
    if (isSchemaMissingError(error)) {
      local.deleteLocalInvoice(id)
      return
    }
    throw error
  }
}
