import { Outlet, useNavigate } from 'react-router'
import { AdminLayout } from '@patafy/ui'
import { useAuth } from '../contexts/AuthContext.js'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/agenda', label: 'Agenda', section: 'AGENDA' },
  { to: '/minha-agenda', label: 'Minha Agenda', section: 'AGENDA' },
  { to: '/clientes/buscar', label: 'Clientes', section: 'GESTÃO' },
  { to: '/servicos', label: 'Serviços', section: 'GESTÃO' },
  { to: '/pacotes', label: 'Pacotes', section: 'GESTÃO' },
  { to: '/relatorios', label: 'Relatórios', section: 'GESTÃO' },
  { to: '/configuracoes', label: 'Configurações', section: 'CONFIGURAÇÕES' },
  { to: '/equipe', label: 'Equipe', section: 'CONFIGURAÇÕES' },
  { to: '/bloqueios', label: 'Bloqueios', section: 'CONFIGURAÇÕES' },
  { to: '/auditoria', label: 'Auditoria', section: 'CONFIGURAÇÕES' },
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
