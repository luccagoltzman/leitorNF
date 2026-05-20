import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useBids } from '../hooks/useBids'
import { linkInvoiceToBid } from '../services/invoices'
import { formatBidLabel } from '../services/bids'
import type { InvoiceWithItems } from '../types/nfe'

interface BidLinkerProps {
  invoice: InvoiceWithItems
}

export function BidLinker({ invoice }: BidLinkerProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: bids = [] } = useBids()
  const [bidId, setBidId] = useState(invoice.bid_id ?? '')

  useEffect(() => {
    setBidId(invoice.bid_id ?? '')
  }, [invoice.bid_id, invoice.id])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await linkInvoiceToBid(
        invoice.id,
        bidId || null,
        user.id,
      )
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', invoice.id] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao vincular')
    } finally {
      setSaving(false)
    }
  }

  const changed = (bidId || '') !== (invoice.bid_id ?? '')

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-slate-900">Licitação / edital</h2>
          <p className="mt-0.5 text-xs text-muted">
            Vincule esta nota ao processo licitatório para filtrar e organizar
            comprovações.
          </p>
        </div>
        <Link
          to="/licitacoes"
          className="text-xs font-medium text-primary-600 hover:underline"
        >
          Gerenciar licitações
        </Link>
      </div>

      {invoice.bid && !changed && (
        <div className="mt-3 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-900">
          <p className="font-medium">{invoice.bid.titulo}</p>
          {(invoice.bid.numero_edital || invoice.bid.orgao) && (
            <p className="mt-0.5 text-xs text-primary-800">
              {[invoice.bid.numero_edital && `Edital ${invoice.bid.numero_edital}`, invoice.bid.orgao]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-[200px] flex-1">
          <span className="mb-1 block text-xs font-medium text-slate-700">
            Licitação
          </span>
          <select
            value={bidId}
            onChange={(e) => {
              setBidId(e.target.value)
              setSaved(false)
            }}
            disabled={saving}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          >
            <option value="">Sem vínculo</option>
            {bids.map((bid) => (
              <option key={bid.id} value={bid.id}>
                {formatBidLabel(bid)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !changed}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar vínculo'}
        </button>
      </div>

      {bids.length === 0 && (
        <p className="mt-2 text-xs text-muted">
          Nenhuma licitação cadastrada.{' '}
          <Link to="/licitacoes" className="text-primary-600 hover:underline">
            Criar a primeira
          </Link>
        </p>
      )}
      {saved && <p className="mt-2 text-xs text-success">Vínculo atualizado.</p>}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </section>
  )
}
