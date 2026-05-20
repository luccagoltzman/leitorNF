import type { InvoiceFilters } from '../types/nfe'

interface SearchFiltersProps {
  filters: InvoiceFilters
  onChange: (filters: InvoiceFilters) => void
}

export function SearchFilters({ filters, onChange }: SearchFiltersProps) {
  return (
    <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="block sm:col-span-2 lg:col-span-1">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Buscar nota
        </span>
        <input
          type="search"
          placeholder="Número, emitente, CNPJ ou chave..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </label>
      <label className="block sm:col-span-2 lg:col-span-1">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Buscar produto
        </span>
        <input
          type="search"
          placeholder="Descrição, código ou NCM..."
          value={filters.productSearch ?? ''}
          onChange={(e) =>
            onChange({ ...filters, productSearch: e.target.value })
          }
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Status do documento
        </span>
        <select
          value={filters.completeness ?? 'all'}
          onChange={(e) =>
            onChange({
              ...filters,
              completeness: e.target.value as InvoiceFilters['completeness'],
            })
          }
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        >
          <option value="all">Todas</option>
          <option value="complete">Com PDF</option>
          <option value="incomplete">Sem PDF</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Data inicial
        </span>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-slate-700">
          Data final
        </span>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value })}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
      </label>
    </div>
  )
}
