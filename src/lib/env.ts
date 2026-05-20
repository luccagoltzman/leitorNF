/** Config injetada em public/runtime-config.js no build (Vercel, Netlify, etc.). */
export interface RuntimeConfig {
  VITE_SUPABASE_URL?: string
  VITE_SUPABASE_ANON_KEY?: string
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig
  }
}

const PLACEHOLDER_PATTERNS = [
  /^sua-chave/i,
  /^xxxxxxxx/i,
  /^https:\/\/xxxx/i,
  /placeholder/i,
  /^sua-chave-publishable/i,
]

function clean(value: string | undefined): string {
  return (value ?? '').trim()
}

function isRealValue(value: string): boolean {
  if (!value) return false
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(value))
}

function readRaw(): { url: string; key: string } {
  const runtime =
    typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ : undefined

  const url = clean(import.meta.env.VITE_SUPABASE_URL || runtime?.VITE_SUPABASE_URL)
  const key = clean(
    import.meta.env.VITE_SUPABASE_ANON_KEY || runtime?.VITE_SUPABASE_ANON_KEY,
  )

  return { url, key }
}

export function getSupabaseEnv(): { url: string; key: string } {
  const { url, key } = readRaw()
  return {
    url: isRealValue(url) ? url : '',
    key: isRealValue(key) ? key : '',
  }
}

export function isSupabaseEnvConfigured(): boolean {
  const { url, key } = getSupabaseEnv()
  return Boolean(url && key)
}

export const isProductionBuild = import.meta.env.PROD
