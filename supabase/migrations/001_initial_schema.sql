-- Leitor NF-e — schema inicial (MVP)
-- Execute no SQL Editor do Supabase ou via CLI: supabase db push

-- Tabela de notas fiscais
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  numero_nf text,
  serie text,
  chave_acesso text,
  emitente text,
  emitente_cnpj text,
  destinatario text,
  destinatario_doc text,
  valor_total numeric(15, 2),
  frete numeric(15, 2) default 0,
  desconto numeric(15, 2) default 0,
  data_emissao timestamptz,
  natureza_operacao text,
  arquivo_url text,
  created_at timestamptz not null default now()
);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_data_emissao_idx on public.invoices (data_emissao desc);
create index if not exists invoices_numero_nf_idx on public.invoices (numero_nf);
create index if not exists invoices_emitente_idx on public.invoices (emitente);

-- Itens da nota
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  codigo text,
  descricao text,
  ncm text,
  cfop text,
  quantidade numeric(15, 4),
  valor_unitario numeric(15, 4),
  valor_total numeric(15, 2),
  icms numeric(15, 2) default 0,
  ipi numeric(15, 2) default 0,
  pis numeric(15, 2) default 0,
  cofins numeric(15, 2) default 0
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);

-- RLS
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

create policy "Usuário vê suas notas"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Usuário insere suas notas"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Usuário atualiza suas notas"
  on public.invoices for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuário exclui suas notas"
  on public.invoices for delete
  using (auth.uid() = user_id);

create policy "Usuário vê itens das suas notas"
  on public.invoice_items for select
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

create policy "Usuário insere itens nas suas notas"
  on public.invoice_items for insert
  with check (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

create policy "Usuário atualiza itens das suas notas"
  on public.invoice_items for update
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

create policy "Usuário exclui itens das suas notas"
  on public.invoice_items for delete
  using (
    exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.user_id = auth.uid()
    )
  );

-- Storage bucket para XMLs (criar bucket "invoices" no painel se não existir)
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

create policy "Upload na pasta do usuário"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Leitura dos próprios arquivos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Exclusão dos próprios arquivos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'invoices'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
