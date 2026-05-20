import type {
  InvoiceFilters,
  InvoiceItem,
  InvoiceWithItems,
  ParsedNfe,
} from '../types/nfe'

const STORAGE_KEY = 'leitor-nf-invoices'
const MAX_INVOICES = 30
const MAX_ITEMS_PER_INVOICE = 100
const MAX_DESC_LENGTH = 200

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.code === 22)
  )
}

function loadAll(): InvoiceWithItems[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as InvoiceWithItems[]
    if (raw.length > 3_000_000) {
      const compact = parsed.slice(0, MAX_INVOICES).map(trimForLocal)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compact))
      } catch {
        /* quota ainda cheio — usuário usa "Limpar dados locais" */
      }
      return compact
    }
    return parsed
  } catch {
    return []
  }
}

function trimForLocal(inv: InvoiceWithItems): InvoiceWithItems {
  return {
    ...inv,
    arquivo_url: inv.arquivo_url ? inv.arquivo_url.split(/[/\\]/).pop() ?? inv.arquivo_url : null,
    invoice_items: inv.invoice_items
      .slice(0, MAX_ITEMS_PER_INVOICE)
      .map((item) => ({
        ...item,
        descricao: item.descricao
          ? item.descricao.slice(0, MAX_DESC_LENGTH)
          : item.descricao,
      })),
  }
}

function persist(invoices: InvoiceWithItems[]): void {
  let list = invoices.slice(0, MAX_INVOICES).map(trimForLocal)

  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
      return
    } catch (error) {
      if (!isQuotaError(error)) throw error
      if (list.length <= 1) break
      list = list.slice(0, Math.max(1, Math.floor(list.length / 2)))
    }
  }

  throw new Error(
    'Espaço de armazenamento do navegador cheio. Exclua notas antigas no dashboard, limpe os dados locais ou faça login para salvar no Supabase.',
  )
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
    const haystack = [inv.numero_nf, inv.emitente, inv.chave_acesso]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }
  return true
}

export function getLocalInvoiceCount(): number {
  return loadAll().length
}

export function clearLocalInvoices(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function saveLocalInvoice(
  parsed: ParsedNfe,
  arquivoRef: string,
): InvoiceWithItems {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const invoice_items: InvoiceItem[] = parsed.produtos
    .slice(0, MAX_ITEMS_PER_INVOICE)
    .map((p) => ({
      id: crypto.randomUUID(),
      invoice_id: id,
      codigo: p.codigo,
      descricao: p.descricao.slice(0, MAX_DESC_LENGTH),
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
  persist([trimForLocal(invoice), ...all.filter((i) => i.id !== id)])
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
