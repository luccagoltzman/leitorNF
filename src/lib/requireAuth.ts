import { isSupabaseConfigured, supabase } from './supabase'

export const SUPABASE_NOT_CONFIGURED_MSG =
  'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env na raiz do projeto.'

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
