/**
 * Gera public/runtime-config.js a partir das variáveis de ambiente no build.
 * No Vercel/Netlify, defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes do deploy.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotEnv(filename) {
  if (!existsSync(filename)) return
  for (const line of readFileSync(filename, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  loadDotEnv(file)
}

const url =
  process.env.VITE_SUPABASE_URL?.trim() ||
  process.env.SUPABASE_URL?.trim() ||
  ''
const key =
  process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_ANON_KEY?.trim() ||
  process.env.SUPABASE_KEY?.trim() ||
  ''

const config = { VITE_SUPABASE_URL: url, VITE_SUPABASE_ANON_KEY: key }

const out = resolve('public/runtime-config.js')
writeFileSync(
  out,
  `window.__RUNTIME_CONFIG__=${JSON.stringify(config)};\n`,
  'utf8',
)

if (url && key) {
  console.log('[runtime-config] Gerado com URL do Supabase.')
} else {
  console.warn(
    '[runtime-config] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes no build — produção exibirá aviso de configuração.',
  )
}
