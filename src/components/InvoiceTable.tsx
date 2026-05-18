import { Link } from 'react-router-dom'
import type { InvoiceWithItems } from '../types/nfe'
import { formatCurrency, formatDate } from '../utils/format'

interface InvoiceTableProps {
  invoices: InvoiceWithItems[]
  onExport?: (invoice: InvoiceWithItems) => void
  onDelete?: (id: string) => void
}

export function InvoiceTable({ invoices, onExport, onDelete }: InvoiceTableProps) {
  if (!invoices.length) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <p className="text-muted">Nenhuma nota fiscal encontrada.</p>
        <Link
          to="/upload"
          className="mt-3 inline-block text-sm font-medium text-primary-600 hover:underline"
        >
          Enviar primeira NF-e
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">NF</th>
              <th className="px-4 py-3 font-medium">Emitente</th>
              <th className="px-4 py-3 font-medium">Emissão</th>
              <th className="px-4 py-3 font-medium text-right">Valor</th>
              <th className="px-4 py-3 font-medium text-right">Itens</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3 font-medium text-slate-900">
                  <Link
                    to={`/notas/${inv.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {inv.numero_nf ?? '—'}
                    {inv.serie ? ` / ${inv.serie}` : ''}
                  </Link>
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 text-slate-700">
                  {inv.emitente ?? '—'}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {formatDate(inv.data_emissao)}
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-900">
                  {formatCurrency(inv.valor_total)}
                </td>
                <td className="px-4 py-3 text-right text-slate-600">
                  {inv.invoice_items?.length ?? 0}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/notas/${inv.id}`}
                      className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                    >
                      Ver
                    </Link>
                    {onExport && (
                      <button
                        type="button"
                        onClick={() => onExport(inv)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                      >
                        Excel
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(inv.id)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-red-50"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
