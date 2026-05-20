import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv, isSupabaseEnvConfigured } from './env'

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseEnv()

if (!isSupabaseEnvConfigured()) {
  console.warn(
    '[Leitor NF-e] Supabase não configurado: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no build (arquivo .env local ou variáveis no painel da hospedagem).',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
)

export const isSupabaseConfigured = isSupabaseEnvConfigured()
