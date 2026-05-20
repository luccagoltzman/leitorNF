import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBids } from '../hooks/useBids'
import { InvoiceTable } from '../components/InvoiceTable'
import { SearchFilters } from '../components/SearchFilters'
import { useDeleteInvoice, useInvoices } from '../hooks/useInvoices'
import { isSupabaseSchemaReady } from '../services/invoices'
import type { InvoiceFilters } from '../types/nfe'
import { exportInvoiceToExcel, exportInvoicesListToExcel } from '../utils/excelExport'
import { exportInvoiceToPdf } from '../utils/pdfExport'
import { formatCurrency } from '../utils/format'
import { SCHEMA_MISSING_HINT } from '../utils/supabaseErrors'
import { isSupabaseConfigured } from '../lib/supabase'

export function DashboardPage() {
  const [searchParams] = useSearchParams()
  const bidFromUrl = searchParams.get('bid') ?? undefined
  const [filters, setFilters] = useState<InvoiceFilters>(() =>
    bidFromUrl ? { bidId: bidFromUrl } : {},
  )
  const { data: bids = [] } = useBids()
  const { data: invoices = [], isLoading, error } = useInvoices(filters)

  useEffect(() => {
    if (bidFromUrl) {
      setFilters((f) => ({ ...f, bidId: bidFromUrl, unlinkedOnly: false }))
    }
  }, [bidFromUrl])
  const deleteMutation = useDeleteInvoice()
  const { data: schemaReady } = useQuery({
    queryKey: ['supabase-schema'],
    queryFn: isSupabaseSchemaReady,
    enabled: isSupabaseConfigured,
  })

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (inv.valor_total ?? 0), 0)
    const withoutPdf = invoices.filter((inv) => !inv.pdf_url).length
    return { count: invoices.length, total, withoutPdf }
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Notas processadas" value={String(stats.count)} />
        <StatCard label="Valor total" value={formatCurrency(stats.total)} />
        <StatCard
          label="Sem PDF (pendentes)"
          value={String(stats.withoutPdf)}
          warn={stats.withoutPdf > 0}
        />
      </div>

      <SearchFilters filters={filters} onChange={setFilters} bids={bids} />

      {isSupabaseConfigured && schemaReady === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Banco ainda não configurado no Supabase</p>
          <p className="mt-1">{SCHEMA_MISSING_HINT}</p>
        </div>
      )}

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
        onExportExcel={exportInvoiceToExcel}
        onExportPdf={exportInvoiceToPdf}
        onDelete={(id) => {
          if (confirm('Excluir esta nota fiscal?')) {
            deleteMutation.mutate(id)
          }
        }}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string
  value: string
  warn?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${warn ? 'text-amber-700' : 'text-slate-900'}`}
      >
        {value}
      </p>
    </div>
  )
}
