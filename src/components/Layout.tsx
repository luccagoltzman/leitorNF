import { useQueryClient } from '@tanstack/react-query'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? 'bg-primary-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
  }`

export function Layout() {
  const { user, signOut, loading } = useAuth()
  const queryClient = useQueryClient()

  async function handleSignOut() {
    await signOut()
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-sm font-bold text-white">
              NF
            </span>
            <span className="text-lg font-semibold text-slate-900">Leitor NF-e</span>
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navLinkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/upload" className={navLinkClass}>
              Upload
            </NavLink>
          </nav>

          <div className="flex items-center gap-3">
            {!loading && user ? (
              <>
                <span className="hidden max-w-[200px] truncate text-sm text-muted sm:inline">
                  {user.email}
                </span>
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-800">
                  Supabase
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                {isSupabaseConfigured ? (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                    Sem login
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                    Modo local
                  </span>
                )}
                <Link
                  to="/login"
                  className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Entrar
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
