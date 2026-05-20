import { isProductionBuild } from '../lib/env'
import {
  SUPABASE_NOT_CONFIGURED_MSG_LOCAL,
  SUPABASE_NOT_CONFIGURED_MSG_PRODUCTION,
} from '../lib/requireAuth'

export function SupabaseSetupNotice() {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-sm text-amber-900">
      <p className="text-center font-medium">Supabase não configurado</p>

      {isProductionBuild ? (
        <>
          <p>{SUPABASE_NOT_CONFIGURED_MSG_PRODUCTION}</p>
          <div className="rounded-lg bg-white/80 px-4 py-3 text-left text-xs">
            <p className="font-semibold text-slate-800">Exemplo (Vercel)</p>
            <ol className="mt-2 list-decimal space-y-1 pl-4 text-slate-700">
              <li>Project → Settings → Environment Variables</li>
              <li>
                <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code>{' '}
                = URL do projeto (ex.: https://xxx.supabase.co)
              </li>
              <li>
                <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code>{' '}
                = chave anon ou publishable do Supabase
              </li>
              <li>Salvar e clicar em <strong>Redeploy</strong></li>
            </ol>
          </div>
        </>
      ) : (
        <>
          <p>{SUPABASE_NOT_CONFIGURED_MSG_LOCAL}</p>
          <pre className="overflow-x-auto rounded-lg bg-white/80 p-3 text-left text-xs text-slate-800">
{`VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-ou-publishable`}
          </pre>
        </>
      )}
    </div>
  )
}
