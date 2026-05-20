import type { Bid, InvoiceWithItems } from '../types/nfe'

export const INVOICE_SELECT =
  '*, invoice_items(*), bid:bids(id, user_id, titulo, numero_edital, orgao, processo, observacoes, created_at, updated_at)'

type InvoiceRow = InvoiceWithItems & { bid?: Bid | Bid[] | null }

export function mapInvoiceRow(row: InvoiceRow): InvoiceWithItems {
  const bidRaw = row.bid
  const bid = Array.isArray(bidRaw) ? bidRaw[0] ?? null : bidRaw ?? null
  const { bid: _b, ...rest } = row
  return {
    ...rest,
    bid_id: rest.bid_id ?? null,
    bid,
    invoice_items: rest.invoice_items ?? [],
  }
}

export function mapInvoiceRows(rows: InvoiceRow[]): InvoiceWithItems[] {
  return rows.map(mapInvoiceRow)
}
