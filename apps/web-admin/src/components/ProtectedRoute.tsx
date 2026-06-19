import { Navigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isSystemAdmin } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (!isSystemAdmin) return <Navigate to="/acesso-negado" replace />
  return <>{children}</>
}
