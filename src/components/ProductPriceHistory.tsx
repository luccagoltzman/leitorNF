import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { InvoiceItem, InvoiceWithItems } from '../types/nfe'
import {
  findProductPriceHistory,
  normalizeProductKey,
} from '../utils/invoiceFilters'
import { formatCurrency, formatDate, formatQuantity } from '../utils/format'

interface ProductPriceHistoryProps {
  invoice: InvoiceWithItems
  allInvoices: InvoiceWithItems[]
}

export function ProductPriceHistory({
  invoice,
  allInvoices,
}: ProductPriceHistoryProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const items = invoice.invoice_items ?? []

  const selectedItem = items.find((i) => i.id === selectedItemId)

  const history = useMemo(() => {
    if (!selectedItem) return []
    return findProductPriceHistory(
      allInvoices,
      selectedItem.descricao,
      invoice.id,
    )
  }, [allInvoices, selectedItem, invoice.id])

  if (!items.length) return null

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-4 py-3">
        <h2 className="font-semibold text-slate-900">Histórico de preço</h2>
        <p className="mt-0.5 text-xs text-muted">
          Clique em um item para ver compras semelhantes em outras notas
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              setSelectedItemId((id) => (id === item.id ? null : item.id))
            }
            className={`max-w-full rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
              selectedItemId === item.id
                ? 'border-primary-500 bg-primary-50 text-primary-800'
                : 'border-border bg-slate-50 text-slate-700 hover:bg-white'
            }`}
          >
            <span className="line-clamp-2 font-medium">
              {(item.descricao ?? 'Item').slice(0, 60)}
            </span>
            <span className="mt-1 block text-muted">
              {formatCurrency(item.valor_unitario)} / un.
            </span>
          </button>
        ))}
      </div>
      {selectedItem && (
        <HistoryPanel item={selectedItem} entries={history} />
      )}
    </section>
  )
}

function HistoryPanel({
  item,
  entries,
}: {
  item: InvoiceItem
  entries: ReturnType<typeof findProductPriceHistory>
}) {
  const key = normalizeProductKey(item.descricao)

  if (!entries.length) {
    return (
      <p className="border-t border-border px-4 py-4 text-sm text-muted">
        Nenhuma outra nota com produto semelhante a &quot;{key.slice(0, 50)}
        …&quot; foi encontrada.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto border-t border-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-2">NF</th>
            <th className="px-4 py-2">Data</th>
            <th className="px-4 py-2">Fornecedor</th>
            <th className="px-4 py-2 text-right">Qtd</th>
            <th className="px-4 py-2 text-right">Unit.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {entries.map((entry) => (
            <tr key={`${entry.invoiceId}-${entry.descricao}`}>
              <td className="px-4 py-2">
                <Link
                  to={`/notas/${entry.invoiceId}`}
                  className="font-medium text-primary-600 hover:underline"
                >
                  {entry.numeroNf ?? '—'}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-600">
                {formatDate(entry.dataEmissao)}
              </td>
              <td className="max-w-[180px] truncate px-4 py-2 text-slate-700">
                {entry.emitente ?? '—'}
              </td>
              <td className="px-4 py-2 text-right">
                {formatQuantity(entry.quantidade)}
              </td>
              <td className="px-4 py-2 text-right font-medium text-slate-900">
                {formatCurrency(entry.valorUnitario)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
