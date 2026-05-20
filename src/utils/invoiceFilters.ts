import type { InvoiceFilters, InvoiceWithItems } from '../types/nfe'

export function normalizeProductKey(desc: string | null | undefined): string {
  if (!desc) return ''
  return desc
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function matchesGeneralSearch(inv: InvoiceWithItems, search: string): boolean {
  const term = search.toLowerCase()
  const fields = [
    inv.numero_nf,
    inv.serie,
    inv.emitente,
    inv.emitente_cnpj,
    inv.chave_acesso,
    inv.destinatario,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (fields.includes(term)) return true

  return (inv.invoice_items ?? []).some((item) => {
    const itemHay = [item.codigo, item.descricao, item.ncm, item.cfop]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return itemHay.includes(term)
  })
}

function matchesProductSearch(inv: InvoiceWithItems, productSearch: string): boolean {
  const term = productSearch.toLowerCase()
  return (inv.invoice_items ?? []).some((item) => {
    const hay = [item.codigo, item.descricao, item.ncm]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(term)
  })
}

function matchesCompleteness(
  inv: InvoiceWithItems,
  completeness: InvoiceFilters['completeness'],
): boolean {
  if (!completeness || completeness === 'all') return true
  const hasPdf = Boolean(inv.pdf_url)
  if (completeness === 'complete') return hasPdf
  return !hasPdf
}

function matchesDates(inv: InvoiceWithItems, filters: InvoiceFilters): boolean {
  if (filters.dateFrom && inv.data_emissao) {
    if (inv.data_emissao < filters.dateFrom) return false
  }
  if (filters.dateTo && inv.data_emissao) {
    if (inv.data_emissao > `${filters.dateTo}T23:59:59`) return false
  }
  return true
}

export function filterInvoices(
  invoices: InvoiceWithItems[],
  filters?: InvoiceFilters,
): InvoiceWithItems[] {
  if (!filters) return invoices

  return invoices.filter((inv) => {
    if (!matchesDates(inv, filters)) return false
    if (!matchesCompleteness(inv, filters.completeness)) return false

    const search = filters.search?.trim()
    if (search && !matchesGeneralSearch(inv, search)) return false

    const productSearch = filters.productSearch?.trim()
    if (productSearch && !matchesProductSearch(inv, productSearch)) return false

    return true
  })
}

export interface ProductPriceEntry {
  invoiceId: string
  numeroNf: string | null
  dataEmissao: string | null
  emitente: string | null
  descricao: string | null
  quantidade: number | null
  valorUnitario: number | null
  valorTotal: number | null
}

export function findProductPriceHistory(
  invoices: InvoiceWithItems[],
  itemDescricao: string | null | undefined,
  excludeInvoiceId?: string,
): ProductPriceEntry[] {
  const key = normalizeProductKey(itemDescricao)
  if (!key) return []

  const entries: ProductPriceEntry[] = []

  for (const inv of invoices) {
    for (const item of inv.invoice_items ?? []) {
      const itemKey = normalizeProductKey(item.descricao)
      if (!itemKey) continue
      const matches =
        itemKey === key ||
        itemKey.includes(key) ||
        key.includes(itemKey)
      if (!matches) continue

      entries.push({
        invoiceId: inv.id,
        numeroNf: inv.numero_nf,
        dataEmissao: inv.data_emissao,
        emitente: inv.emitente,
        descricao: item.descricao,
        quantidade: item.quantidade,
        valorUnitario: item.valor_unitario,
        valorTotal: item.valor_total,
      })
    }
  }

  return entries
    .filter((e) => e.invoiceId !== excludeInvoiceId)
    .sort((a, b) => {
      const da = a.dataEmissao ? new Date(a.dataEmissao).getTime() : 0
      const db = b.dataEmissao ? new Date(b.dataEmissao).getTime() : 0
      return db - da
    })
}
