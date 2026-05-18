import { Link, useParams } from 'react-router-dom'
import { InvoiceDetailView } from '../components/InvoiceDetailView'
import { useInvoice } from '../hooks/useInvoices'
import { exportInvoiceToExcel } from '../utils/excelExport'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: invoice, isLoading, error } = useInvoice(id)

  if (isLoading) {
    return <p className="text-center text-sm text-muted">Carregando nota...</p>
  }

  if (error || !invoice) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-danger">
          {error instanceof Error ? error.message : 'Nota não encontrada'}
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Voltar ao dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Link to="/" className="text-sm text-primary-600 hover:underline">
        ← Voltar
      </Link>
      <InvoiceDetailView
        invoice={invoice}
        onExport={() => exportInvoiceToExcel(invoice)}
      />
    </div>
  )
}
