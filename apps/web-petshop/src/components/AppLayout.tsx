import { Outlet, useNavigate } from 'react-router'
import { AdminLayout } from '@patafy/ui'
import { useAuth } from '../contexts/AuthContext.js'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/configuracoes', label: 'Configurações' },
  { to: '/equipe', label: 'Equipe' },
  { to: '/bloqueios', label: 'Bloqueios de Agenda' },
]

export function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <AdminLayout
      title="Patafy Pet Shop"
      navItems={NAV_ITEMS}
      userEmail={user?.email ?? ''}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AdminLayout>
  )
}
