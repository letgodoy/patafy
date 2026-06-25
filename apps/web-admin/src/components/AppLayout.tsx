import { Outlet, useNavigate } from 'react-router'
import { AdminLayout } from '@patafy/ui'
import { useAuth } from '../contexts/AuthContext.js'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/petshops', label: 'Pet Shops' },
  { to: '/catalogo/tipos', label: 'Tipos de Animal' },
  { to: '/catalogo/racas', label: 'Raças' },
  { to: '/catalogo/portes', label: 'Portes' },
  { to: '/catalogo/pelagens', label: 'Pelagens' },
  { to: '/admins', label: 'Administradores' },
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
      navItems={NAV_ITEMS}
      userEmail={user?.email ?? ''}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AdminLayout>
  )
}
