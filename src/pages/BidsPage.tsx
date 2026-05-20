import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  useBids,
  useCreateBid,
  useDeleteBid,
  useUpdateBid,
} from '../hooks/useBids'
import { useInvoices } from '../hooks/useInvoices'
import type { Bid, BidInput } from '../types/nfe'
import { formatCurrency } from '../utils/format'

const emptyForm: BidInput = {
  titulo: '',
  numero_edital: '',
  orgao: '',
  processo: '',
  observacoes: '',
}

export function BidsPage() {
  const { user } = useAuth()
  const { data: bids = [], isLoading } = useBids()
  const { data: invoices = [] } = useInvoices()
  const createMutation = useCreateBid()
  const updateMutation = useUpdateBid()
  const deleteMutation = useDeleteBid()

  const [form, setForm] = useState<BidInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const statsByBid = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>()
    for (const inv of invoices) {
      if (!inv.bid_id) continue
      const cur = map.get(inv.bid_id) ?? { count: 0, total: 0 }
      cur.count += 1
      cur.total += inv.valor_total ?? 0
      map.set(inv.bid_id, cur)
    }
    return map
  }, [invoices])

  function startEdit(bid: Bid) {
    setEditingId(bid.id)
    setForm({
      titulo: bid.titulo,
      numero_edital: bid.numero_edital ?? '',
      orgao: bid.orgao ?? '',
      processo: bid.processo ?? '',
      observacoes: bid.observacoes ?? '',
    })
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo.trim()) {
      setError('Informe um título para a licitação.')
      return
    }

    setError(null)
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, input: form })
        cancelEdit()
      } else {
        await createMutation.mutateAsync({
          input: form,
          userId: user!.id,
        })
        setForm(emptyForm)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Licitações e editais</h1>
        <p className="mt-1 text-sm text-muted">
          Cadastre os processos licitatórios e vincule as notas fiscais para
          encontrar comprovações por edital.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 font-semibold text-slate-900">
          {editingId ? 'Editar licitação' : 'Nova licitação'}
        </h2>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Título *
          </span>
          <input
            required
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Ex.: Pregão 123/2026 — Prefeitura de..."
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Nº do edital
          </span>
          <input
            value={form.numero_edital ?? ''}
            onChange={(e) =>
              setForm({ ...form, numero_edital: e.target.value })
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Órgão / entidade
          </span>
          <input
            value={form.orgao ?? ''}
            onChange={(e) => setForm({ ...form, orgao: e.target.value })}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Processo / pregão
          </span>
          <input
            value={form.processo ?? ''}
            onChange={(e) => setForm({ ...form, processo: e.target.value })}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">
            Observações
          </span>
          <textarea
            value={form.observacoes ?? ''}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>

        {error && (
          <p className="sm:col-span-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-60"
          >
            {editingId ? 'Atualizar' : 'Cadastrar'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {isLoading && (
        <p className="text-sm text-muted">Carregando licitações...</p>
      )}

      {!isLoading && bids.length === 0 && (
        <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted">
          Nenhuma licitação cadastrada. Use o formulário acima para começar.
        </p>
      )}

      {bids.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Licitação</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bids.map((bid) => {
                const stats = statsByBid.get(bid.id) ?? { count: 0, total: 0 }
                return (
                  <tr key={bid.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{bid.titulo}</p>
                      <p className="text-xs text-muted">
                        {[bid.numero_edital && `Edital ${bid.numero_edital}`, bid.orgao, bid.processo]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{stats.count}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(stats.total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/?bid=${bid.id}`}
                          className="rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                        >
                          Ver notas
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEdit(bid)}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              confirm(
                                `Excluir "${bid.titulo}"? As notas ficarão sem vínculo.`,
                              )
                            ) {
                              deleteMutation.mutate(bid.id)
                            }
                          }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-red-50"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
