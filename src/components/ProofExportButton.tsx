import { useState } from 'react'
import type { InvoiceWithItems } from '../types/nfe'
import { exportProofDocuments, exportProofPackage } from '../utils/proofExport'

interface ProofExportButtonProps {
  invoice: InvoiceWithItems
  variant?: 'primary' | 'compact'
}

export function ProofExportButton({
  invoice,
  variant = 'compact',
}: ProofExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      await exportProofPackage(invoice)
    } catch (err) {
      try {
        exportProofDocuments(invoice)
      } catch {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível gerar o pacote.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const className =
    variant === 'primary'
      ? 'rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60'
      : 'rounded-md px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-50 disabled:opacity-60'

  return (
    <span className="inline-flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={handleExport}
        disabled={loading}
        title="ZIP com planilha, resumo PDF e arquivos originais (quando disponíveis)"
        className={className}
      >
        {loading ? 'Gerando…' : 'Comprovação'}
      </button>
      {error && (
        <span className="text-xs text-danger">{error}</span>
      )}
    </span>
  )
}
