-- Licitações / editais e vínculo com notas fiscais

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  titulo text not null,
  numero_edital text,
  orgao text,
  processo text,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bids_user_id_idx on public.bids (user_id);
create index if not exists bids_titulo_idx on public.bids (titulo);

alter table public.invoices
  add column if not exists bid_id uuid references public.bids (id) on delete set null;

create index if not exists invoices_bid_id_idx on public.invoices (bid_id);

alter table public.bids enable row level security;

create policy "Usuário vê suas licitações"
  on public.bids for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas licitações"
  on public.bids for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas licitações"
  on public.bids for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário exclui suas licitações"
  on public.bids for delete
  using (auth.uid() = user_id);

notify pgrst, 'reload schema';
