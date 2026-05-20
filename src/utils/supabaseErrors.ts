/** Tabela/relação ainda não criada no projeto Supabase (migration pendente). */
export function isSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false

  const e = error as { code?: string; message?: string; status?: number }
  const msg = (e.message ?? '').toLowerCase()

  return (
    e.code === 'PGRST205' ||
    e.status === 404 ||
    msg.includes('does not exist') ||
    msg.includes('relation') ||
    msg.includes('schema cache') ||
    msg.includes('not found')
  )
}

export const SCHEMA_MISSING_HINT =
  'As tabelas ainda não existem no Supabase. Peça para executar o arquivo supabase/migrations/001_initial_schema.sql no SQL Editor do projeto.'

/** Coluna pdf_url ainda não criada (migration 002 pendente). */
export function isPdfColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const e = error as { code?: string; message?: string }
  return (
    e.code === 'PGRST204' &&
    (e.message?.includes('pdf_url') ?? false)
  )
}

export const PDF_COLUMN_HINT =
  'Execute supabase/migrations/002_add_pdf_url.sql no SQL Editor do Supabase (com notify pgrst). Depois recarregue o app.'

export const BIDS_SCHEMA_HINT =
  'Execute supabase/migrations/003_bids.sql no SQL Editor do Supabase (com notify pgrst). Depois recarregue o app.'
