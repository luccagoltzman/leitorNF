import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { attachPdfToInvoice } from '../services/invoices'
import type { InvoiceWithItems } from '../types/nfe'
import { validatePdfFile } from '../utils/nfeFilePairs'

interface AttachPdfBlockProps {
  invoice: InvoiceWithItems
}

export function AttachPdfBlock({ invoice }: AttachPdfBlockProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (invoice.pdf_url) return null

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user) return

    const pdfError = validatePdfFile(file)
    if (pdfError) {
      setError(pdfError)
      return
    }

    setProcessing(true)
    setError(null)
    setMessage(null)

    try {
      await attachPdfToInvoice(invoice.id, file, user.id)
      setMessage('PDF guardado com sucesso.')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] })
      queryClient.invalidateQueries({ queryKey: ['invoice-files', invoice.id] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar PDF')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-medium text-amber-900">PDF ainda não guardado</p>
      <p className="mt-1 text-xs text-amber-800">
        Envie o PDF desta nota (etapa 2 do upload ou aqui).
      </p>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700">
        {processing ? 'Enviando...' : 'Enviar PDF'}
        <input
          type="file"
          accept=".pdf,application/pdf"
          className="sr-only"
          disabled={processing || !user}
          onChange={onFileChange}
        />
      </label>
      {message && <p className="mt-2 text-xs text-success">{message}</p>}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  )
}
