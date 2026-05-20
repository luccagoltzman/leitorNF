import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { FileUpload } from '../components/FileUpload'
import { saveInvoiceFromParsed } from '../services/invoices'
import { parseNfeXml, readXmlFile } from '../utils/xmlParser'

interface UploadItem {
  file: File
  status: 'pending' | 'processing' | 'done' | 'error'
  message?: string
}

export function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [queue, setQueue] = useState<UploadItem[]>([])
  const [processing, setProcessing] = useState(false)

  async function processFiles(files: File[]) {
    const items: UploadItem[] = files.map((file) => ({ file, status: 'pending' }))
    setQueue((prev) => [...prev, ...items])
    setProcessing(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setQueue((prev) =>
        prev.map((item) =>
          item.file === file ? { ...item, status: 'processing' } : item,
        ),
      )

      try {
        const xml = await readXmlFile(file)
        const parsed = parseNfeXml(xml)
        const saved = await saveInvoiceFromParsed(parsed, {
          file,
          userId: user?.id,
        })

        setQueue((prev) =>
          prev.map((item) =>
            item.file === file
              ? { ...item, status: 'done', message: `NF ${saved.numero_nf} salva` }
              : item,
          ),
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro no processamento'
        setQueue((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, status: 'error', message } : item,
          ),
        )
      }
    }

    setProcessing(false)
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
  }

  const doneCount = queue.filter((q) => q.status === 'done').length

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Upload de NF-e</h1>
        <p className="mt-1 text-sm text-muted">
          Envie arquivos XML da NF-e para leitura automática (MVP — sem PDF/OCR)
          {user
            ? ' · salvando no Supabase'
            : ' · faça login para salvar na nuvem'}
        </p>
      </div>

      <FileUpload onFilesSelected={processFiles} disabled={processing} />

      {queue.length > 0 && (
        <ul className="space-y-2 rounded-xl border border-border bg-card p-4">
          {queue.map((item) => (
            <li
              key={`${item.file.name}-${item.file.lastModified}`}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="truncate font-medium">{item.file.name}</span>
              <span
                className={
                  item.status === 'done'
                    ? 'text-success'
                    : item.status === 'error'
                      ? 'text-danger'
                      : 'text-muted'
                }
              >
                {item.status === 'processing' && 'Processando...'}
                {item.status === 'pending' && 'Na fila'}
                {item.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && !processing && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Ver no dashboard
          </button>
          <button
            type="button"
            onClick={() => setQueue([])}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Limpar lista
          </button>
        </div>
      )}
    </div>
  )
}
