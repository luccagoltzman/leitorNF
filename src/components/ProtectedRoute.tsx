import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { SupabaseSetupNotice } from './SupabaseSetupNotice'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (!isSupabaseConfigured) {
    return <SupabaseSetupNotice />
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
