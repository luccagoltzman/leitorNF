import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { FileUpload } from '../components/FileUpload'
import { useInvoices } from '../hooks/useInvoices'
import { attachPdfToInvoice, saveInvoiceFromXml } from '../services/invoices'
import { findInvoiceForPdf, validatePdfFile } from '../utils/nfeFilePairs'
import { parseNfeXml, readXmlFile } from '../utils/xmlParser'

type Step = 'xml' | 'pdf'

export function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [step, setStep] = useState<Step>('xml')
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')

  const { data: invoices = [] } = useInvoices()

  const pendingPdf = useMemo(
    () => invoices.filter((inv) => !inv.pdf_url),
    [invoices],
  )

  async function handleXml(file: File) {
    if (!user) return
    setProcessing(true)
    setError(null)
    setStatus('Lendo XML...')

    try {
      const parsed = parseNfeXml(await readXmlFile(file))
      const saved = await saveInvoiceFromXml(parsed, {
        xmlFile: file,
        userId: user.id,
      })
      setStatus(`NF ${saved.numero_nf} cadastrada. Agora envie o PDF na etapa 2.`)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setStep('pdf')
      setSelectedInvoiceId(saved.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar XML')
      setStatus(null)
    } finally {
      setProcessing(false)
    }
  }

  async function handlePdf(file: File) {
    if (!user) return

    const pdfError = validatePdfFile(file)
    if (pdfError) {
      setError(pdfError)
      return
    }

    let invoiceId = selectedInvoiceId
    if (!invoiceId) {
      const matched = findInvoiceForPdf(file, invoices)
      if (!matched) {
        setError(
          'Selecione a nota na lista ou use um PDF com número/chave da NF no nome.',
        )
        return
      }
      invoiceId = matched.id
    }

    setProcessing(true)
    setError(null)
    setStatus('Guardando PDF...')

    try {
      const updated = await attachPdfToInvoice(invoiceId, file, user.id)
      setStatus(`PDF guardado na NF ${updated.numero_nf}.`)
      setSelectedInvoiceId('')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar PDF')
      setStatus(null)
    } finally {
      setProcessing(false)
    }
  }

  const stepClass = (s: Step) =>
    `flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      step === s
        ? 'bg-primary-600 text-white'
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
    }`

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Guardar NF-e</h1>
        <p className="mt-1 text-sm text-muted">
          Envie <strong>um arquivo por vez</strong>: primeiro o XML, depois o PDF
          da mesma nota.
          {!user && (
            <>
              {' '}
              <Link to="/login" className="text-primary-600 hover:underline">
                Faça login
              </Link>
            </>
          )}
        </p>
      </div>

      <div className="flex gap-2">
        <button type="button" className={stepClass('xml')} onClick={() => setStep('xml')}>
          1. XML
        </button>
        <button
          type="button"
          className={stepClass('pdf')}
          onClick={() => setStep('pdf')}
          disabled={!user}
        >
          2. PDF
          {pendingPdf.length > 0 && (
            <span className="ml-1 rounded-full bg-amber-400 px-1.5 text-xs text-amber-950">
              {pendingPdf.length}
            </span>
          )}
        </button>
      </div>

      {step === 'xml' && (
        <FileUpload
          disabled={processing || !user}
          accept=".xml"
          acceptMime=".xml,application/xml,text/xml"
          title="Enviar XML da NF-e"
          hint="Um arquivo XML por vez. Os dados da nota serão lidos e salvos para busca."
          onFileSelected={handleXml}
        />
      )}

      {step === 'pdf' && (
        <div className="space-y-4">
          {pendingPdf.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted">
              Nenhuma nota aguardando PDF. Cadastre um XML na etapa 1.
            </p>
          ) : (
            <>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">
                  Vincular PDF à nota
                </span>
                <select
                  value={selectedInvoiceId}
                  onChange={(e) => setSelectedInvoiceId(e.target.value)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                  disabled={processing}
                >
                  <option value="">Detectar automaticamente pelo nome do arquivo</option>
                  {pendingPdf.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      NF {inv.numero_nf ?? '—'} · {inv.emitente ?? 'Sem emitente'}
                    </option>
                  ))}
                </select>
              </label>

              <FileUpload
                disabled={processing || !user}
                accept=".pdf"
                acceptMime=".pdf,application/pdf"
                title="Enviar PDF da NF-e"
                hint="Um PDF por vez. Pode ser o DANFE que você já possui."
                onFileSelected={handlePdf}
              />
            </>
          )}
        </div>
      )}

      {status && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-success">{status}</p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ir ao dashboard
        </button>
      </div>
    </div>
  )
}
