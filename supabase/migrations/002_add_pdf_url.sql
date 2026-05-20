-- Caminho do PDF original no Storage (par do XML)
alter table public.invoices
  add column if not exists pdf_url text;

notify pgrst, 'reload schema';
