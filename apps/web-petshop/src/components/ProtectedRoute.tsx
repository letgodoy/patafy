import { Navigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'

interface Props {
  children: React.ReactNode
  roles?: string[]
  petshopId?: string
}

export function ProtectedRoute({ children, roles, petshopId }: Props) {
  const { user, loading } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  // Verificação de role é feita pela API; aqui só garantimos autenticação
  return <>{children}</>
}
