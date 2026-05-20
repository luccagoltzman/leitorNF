import { isProductionBuild } from './env'
import { isSupabaseConfigured, supabase } from './supabase'

export const SUPABASE_NOT_CONFIGURED_MSG_LOCAL =
  'Crie o arquivo .env na raiz do projeto (copie de .env.example) com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY, depois reinicie o npm run dev.'

export const SUPABASE_NOT_CONFIGURED_MSG_PRODUCTION =
  'No painel da hospedagem (Vercel, Netlify, etc.), cadastre as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY e faça um novo deploy. O Vite só incorpora essas variáveis na hora do build — alterar só no servidor sem rebuild não funciona.'

export const SUPABASE_NOT_CONFIGURED_MSG = isProductionBuild
  ? SUPABASE_NOT_CONFIGURED_MSG_PRODUCTION
  : SUPABASE_NOT_CONFIGURED_MSG_LOCAL

export const LOGIN_REQUIRED_MSG =
  'Faça login para usar o sistema.'

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_NOT_CONFIGURED_MSG)
  }
}

export async function assertSession(): Promise<string> {
  assertSupabaseConfigured()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    throw new Error(LOGIN_REQUIRED_MSG)
  }
  return session.user.id
}
