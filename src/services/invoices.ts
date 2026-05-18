import { supabase } from '../lib/supabase'
import type { InvoiceFilters, InvoiceWithItems, ParsedNfe } from '../types/nfe'

const BUCKET = 'invoices'

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
  userId: string,
  parsed: ParsedNfe,
  arquivoUrl: string,
): Promise<InvoiceWithItems> {
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
  if (error) throw error
  return (data ?? []) as InvoiceWithItems[]
}

export async function fetchInvoiceById(id: string): Promise<InvoiceWithItems> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as InvoiceWithItems
}

export async function deleteInvoice(id: string): Promise<void> {
  const { error } = await supabase.from('invoices').delete().eq('id', id)
  if (error) throw error
}
