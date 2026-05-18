import type {
  InvoiceFilters,
  InvoiceItem,
  InvoiceWithItems,
  ParsedNfe,
} from '../types/nfe'

const STORAGE_KEY = 'leitor-nf-invoices'

function loadAll(): InvoiceWithItems[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as InvoiceWithItems[]
  } catch {
    return []
  }
}

function persist(invoices: InvoiceWithItems[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices))
}

function matchesFilters(inv: InvoiceWithItems, filters?: InvoiceFilters): boolean {
  if (filters?.dateFrom && inv.data_emissao) {
    if (inv.data_emissao < filters.dateFrom) return false
  }
  if (filters?.dateTo && inv.data_emissao) {
    if (inv.data_emissao > `${filters.dateTo}T23:59:59`) return false
  }
  const search = filters?.search?.trim().toLowerCase()
  if (search) {
    const haystack = [
      inv.numero_nf,
      inv.emitente,
      inv.chave_acesso,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }
  return true
}

export function saveLocalInvoice(
  parsed: ParsedNfe,
  arquivoRef: string,
): InvoiceWithItems {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const invoice_items: InvoiceItem[] = parsed.produtos.map((p) => ({
    id: crypto.randomUUID(),
    invoice_id: id,
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

  const invoice: InvoiceWithItems = {
    id,
    user_id: 'local',
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
    arquivo_url: arquivoRef,
    created_at: now,
    invoice_items,
  }

  const all = loadAll()
  persist([invoice, ...all])
  return invoice
}

export function fetchLocalInvoices(filters?: InvoiceFilters): InvoiceWithItems[] {
  return loadAll()
    .filter((inv) => matchesFilters(inv, filters))
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
}

export function fetchLocalInvoiceById(id: string): InvoiceWithItems {
  const invoice = loadAll().find((inv) => inv.id === id)
  if (!invoice) throw new Error('Nota não encontrada')
  return invoice
}

export function deleteLocalInvoice(id: string): void {
  persist(loadAll().filter((inv) => inv.id !== id))
}
