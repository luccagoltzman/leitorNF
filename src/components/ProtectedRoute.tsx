import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { SUPABASE_NOT_CONFIGURED_MSG } from '../lib/requireAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 px-6 py-8 text-center text-sm text-amber-900">
        <p className="font-medium">Supabase não configurado</p>
        <p className="mt-2">{SUPABASE_NOT_CONFIGURED_MSG}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <p className="text-center text-sm text-muted">Carregando sessão...</p>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <Outlet />
}
