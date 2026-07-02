import { Outlet, useNavigate } from 'react-router'
import { AdminLayout } from '@patafy/ui'
import { useAuth } from '../contexts/AuthContext.js'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/petshops', label: 'Pet Shops', section: 'CADASTROS' },
  { to: '/admins', label: 'Administradores', section: 'CADASTROS' },
  { to: '/catalogo/tipos', label: 'Tipos de Animal', section: 'CATÁLOGO' },
  { to: '/catalogo/racas', label: 'Raças', section: 'CATÁLOGO' },
  { to: '/catalogo/portes', label: 'Portes', section: 'CATÁLOGO' },
  { to: '/catalogo/pelagens', label: 'Pelagens', section: 'CATÁLOGO' },
  { to: '/auditoria', label: 'Auditoria', section: 'SISTEMA' },
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
      title="Patafy Admin"
      navItems={NAV_ITEMS}
      userEmail={user?.email ?? ''}
      onSignOut={handleSignOut}
    >
      <Outlet />
    </AdminLayout>
  )
}
