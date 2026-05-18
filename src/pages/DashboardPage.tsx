import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { InvoiceTable } from '../components/InvoiceTable'
import { SearchFilters } from '../components/SearchFilters'
import { useDeleteInvoice, useInvoices } from '../hooks/useInvoices'
import type { InvoiceFilters } from '../types/nfe'
import { exportInvoiceToExcel, exportInvoicesListToExcel } from '../utils/excelExport'
import { formatCurrency } from '../utils/format'

export function DashboardPage() {
  const [filters, setFilters] = useState<InvoiceFilters>({})
  const { data: invoices = [], isLoading, error } = useInvoices(filters)
  const deleteMutation = useDeleteInvoice()

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (inv.valor_total ?? 0), 0)
    return { count: invoices.length, total }
  }, [invoices])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-muted">
            Histórico e gestão das notas fiscais processadas
          </p>
        </div>
        <div className="flex gap-2">
          {invoices.length > 0 && (
            <button
              type="button"
              onClick={() => exportInvoicesListToExcel(invoices)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Exportar lista
            </button>
          )}
          <Link
            to="/upload"
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Nova NF-e
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Notas processadas" value={String(stats.count)} />
        <StatCard label="Valor total" value={formatCurrency(stats.total)} />
      </div>

      <SearchFilters filters={filters} onChange={setFilters} />

      {isLoading && (
        <p className="text-center text-sm text-muted">Carregando notas...</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-danger">
          {error instanceof Error ? error.message : 'Erro ao carregar notas'}
        </p>
      )}

      <InvoiceTable
        invoices={invoices}
        onExport={exportInvoiceToExcel}
        onDelete={(id) => {
          if (confirm('Excluir esta nota fiscal?')) {
            deleteMutation.mutate(id)
          }
        }}
      />
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
