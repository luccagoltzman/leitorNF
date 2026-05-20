import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { AttachPdfBlock } from '../components/AttachPdfBlock'
import { InvoiceDetailView } from '../components/InvoiceDetailView'
import { useAuth } from '../contexts/AuthContext'
import { useInvoice } from '../hooks/useInvoices'
import { getInvoiceFileUrls } from '../services/invoices'
import { exportInvoiceToExcel } from '../utils/excelExport'
import { exportInvoiceToPdf } from '../utils/pdfExport'

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: invoice, isLoading, error } = useInvoice(id)

  const { data: fileUrls } = useQuery({
    queryKey: ['invoice-files', id],
    queryFn: () => getInvoiceFileUrls(invoice!),
    enabled: Boolean(id && invoice && user),
  })

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
      <AttachPdfBlock invoice={invoice} />
      <InvoiceDetailView
        invoice={invoice}
        storedPdfUrl={fileUrls?.pdfUrl}
        storedXmlUrl={fileUrls?.xmlUrl}
        onExportExcel={() => exportInvoiceToExcel(invoice)}
        onExportPdf={() => exportInvoiceToPdf(invoice)}
      />
    </div>
  )
}
