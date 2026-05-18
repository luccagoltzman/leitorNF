# Leitor NF-e

Sistema para leitura automática de NF-e (XML), armazenamento e exportação para Excel.

## Stack

- **Frontend:** React, TypeScript, Tailwind CSS, React Query, SheetJS (xlsx)
- **Backend:** Supabase (Auth, PostgreSQL, Storage)

## Funcionalidades (MVP)

- Cadastro e login (e-mail/senha + Google OAuth)
- Upload de XML com drag-and-drop e múltiplos arquivos
- Parser automático da NF-e
- Dashboard com histórico, busca e filtros por data
- Visualização detalhada (emitente, produtos, totais)
- Exportação Excel (abas Resumo e Produtos)
- RLS: cada usuário acessa apenas suas notas

## Configuração

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No **SQL Editor**, execute o arquivo `supabase/migrations/001_initial_schema.sql`
3. Em **Authentication → Providers**, habilite **Email** e, se desejar, **Google**
4. Em **Storage**, confirme o bucket `invoices` (a migration cria se possível)

### 2. Variáveis de ambiente

```bash
cp .env.example .env
```

Preencha com URL e chave **anon** do projeto:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Instalar e rodar

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`

### 4. Deploy (sugestão)

- Frontend: [Vercel](https://vercel.com) — defina as mesmas variáveis `VITE_*`
- Backend: Supabase (já hospedado)

## Estrutura

```
src/
 ├── components/   # UI reutilizável
 ├── pages/        # Telas
 ├── services/     # Supabase e API
 ├── hooks/        # React Query
 ├── utils/        # Parser XML, Excel
 ├── types/
 ├── lib/
 └── contexts/
```

## Próximas fases

- Leitura de PDF/DANFE via OCR
- Geração de PDF organizado
- Integrações ERP (Tiny, Bling, Omie)

## Segurança

- Apenas XML no MVP (validação de extensão e tamanho até 5 MB)
- Bloqueio de `DOCTYPE` / `ENTITY` no parser
- Row Level Security em todas as tabelas
- Arquivos no Storage restritos à pasta do `user_id`
