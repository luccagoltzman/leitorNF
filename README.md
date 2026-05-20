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
- Exportação Excel (abas Resumo e Produtos) e PDF
- **Cofre de documentos:** XML + PDF no Supabase Storage (mesma pasta do usuário)
- PDF gerado automaticamente ao processar XML, ou envio do PDF que o cliente já possui
- RLS: cada usuário acessa apenas suas notas

## Configuração

### 1. Supabase

**Projeto na sua conta:** crie em [supabase.com](https://supabase.com), execute a migration e configure Auth/Storage você mesmo.

**Projeto de outra pessoa (só tem a API key):** peça ao dono do projeto:

| Item | Onde obter |
|------|------------|
| `VITE_SUPABASE_URL` | Dashboard → Settings → API → **Project URL** |
| Chave publishable | Settings → API Keys (a que você já recebeu) |
| Tabelas + RLS | Executar `supabase/migrations/001_initial_schema.sql` e `002_add_pdf_url.sql` no SQL Editor |
| Auth (login) | Habilitar Email/Google em Authentication → Providers |
| Storage | Bucket `invoices` (a migration tenta criar) |

Sem acesso ao dashboard, você **não** consegue rodar migrations nem mudar Auth — o front pode conectar, mas insert/login falham se o banco não estiver preparado.

Enquanto isso, o app funciona em **modo local** (sem `.env` ou sem URL válida): dados no `localStorage` do navegador.

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

## Problemas com `npm install`?

Se o comando fica rodando sem fim ou falha com `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, o Node/npm não está confiando no certificado HTTPS (antivírus com inspeção SSL, proxy corporativo ou VPN).

**Teste rápido (Node 22+):**

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm install
```

**Outras opções:**

1. Desative temporariamente a inspeção HTTPS do antivírus ou adicione exceção para `nodejs` e a pasta do projeto.
2. Mova o projeto para fora do OneDrive (ex.: `C:\dev\leitorNF`) — evita lentidão extrema no `node_modules`.
3. Habilite progresso: `npm config set progress true`

## Próximas fases

- Leitura de PDF/DANFE via OCR
- Geração de PDF organizado
- Integrações ERP (Tiny, Bling, Omie)

## Segurança

- Apenas XML no MVP (validação de extensão e tamanho até 5 MB)
- Bloqueio de `DOCTYPE` / `ENTITY` no parser
- Row Level Security em todas as tabelas
- Arquivos no Storage restritos à pasta do `user_id`
