import type { InvoiceWithItems } from '../types/nfe'
import {
  formatCnpjCpf,
  formatCurrency,
  formatDate,
  formatQuantity,
} from '../utils/format'

interface InvoiceDetailViewProps {
  invoice: InvoiceWithItems
  storedPdfUrl?: string | null
  storedXmlUrl?: string | null
  onExportExcel?: () => void
  onExportPdf?: () => void
}

export function InvoiceDetailView({
  invoice,
  storedPdfUrl,
  storedXmlUrl,
  onExportExcel,
  onExportPdf,
}: InvoiceDetailViewProps) {
  const items = invoice.invoice_items ?? []
  const hasStored = storedPdfUrl || storedXmlUrl

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            NF {invoice.numero_nf ?? '—'}
            {invoice.serie ? ` · Série ${invoice.serie}` : ''}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {invoice.natureza_operacao ?? 'Natureza não informada'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {storedPdfUrl && (
            <a
              href={storedPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100"
            >
              Abrir PDF da nota
            </a>
          )}
          {storedXmlUrl && (
            <a
              href={storedXmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Baixar XML original
            </a>
          )}
          {onExportPdf && !storedPdfUrl && (
            <button
              type="button"
              onClick={onExportPdf}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Exportar resumo PDF
            </button>
          )}
          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
            >
              Exportar Excel
            </button>
          )}
        </div>
      </div>

      {hasStored && (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-muted">
          XML e PDF originais desta NF ficam guardados juntos no cofre do cliente
          (Supabase Storage).
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard title="Emitente" value={invoice.emitente ?? '—'} />
        <InfoCard
          title="CNPJ Emitente"
          value={formatCnpjCpf(invoice.emitente_cnpj)}
        />
        <InfoCard title="Destinatário" value={invoice.destinatario ?? '—'} />
        <InfoCard
          title="Documento destinatário"
          value={formatCnpjCpf(invoice.destinatario_doc)}
        />
        <InfoCard title="Emissão" value={formatDate(invoice.data_emissao)} />
        <InfoCard
          title="Valor total"
          value={formatCurrency(invoice.valor_total)}
          highlight
        />
        <InfoCard title="Frete" value={formatCurrency(invoice.frete)} />
        <InfoCard title="Desconto" value={formatCurrency(invoice.desconto)} />
        <InfoCard
          title="Chave de acesso"
          value={invoice.chave_acesso ?? '—'}
          mono
        />
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-semibold text-slate-900">
            Produtos ({items.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-2">Código</th>
                <th className="px-4 py-2">Descrição</th>
                <th className="px-4 py-2">NCM</th>
                <th className="px-4 py-2">CFOP</th>
                <th className="px-4 py-2 text-right">Qtd</th>
                <th className="px-4 py-2 text-right">Unit.</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-mono text-xs">{item.codigo}</td>
                  <td className="max-w-xs px-4 py-2">{item.descricao}</td>
                  <td className="px-4 py-2">{item.ncm}</td>
                  <td className="px-4 py-2">{item.cfop}</td>
                  <td className="px-4 py-2 text-right">
                    {formatQuantity(item.quantidade)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatCurrency(item.valor_unitario)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatCurrency(item.valor_total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function InfoCard({
  title,
  value,
  highlight,
  mono,
}: {
  title: string
  value: string
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      <p
        className={`mt-1 text-sm ${highlight ? 'text-lg font-bold text-primary-700' : 'text-slate-900'} ${mono ? 'break-all font-mono text-xs' : ''}`}
      >
        {value}
      </p>
    </div>
  )
}
