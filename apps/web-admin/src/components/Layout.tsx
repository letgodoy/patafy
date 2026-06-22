import { NavLink, useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/catalogo/tipos', label: 'Tipos de Animal' },
  { to: '/catalogo/racas', label: 'Raças' },
  { to: '/catalogo/portes', label: 'Portes' },
  { to: '/catalogo/pelagens', label: 'Pelagens' },
  { to: '/admins', label: 'Administradores' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#1a1a2e', color: '#fff', padding: '24px 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', fontWeight: 'bold', fontSize: 18, borderBottom: '1px solid #333' }}>
          Patafy Admin
        </div>
        <nav style={{ flex: 1, marginTop: 16 }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '10px 20px',
                color: isActive ? '#fff' : '#aaa',
                background: isActive ? '#16213e' : 'transparent',
                textDecoration: 'none',
                fontSize: 14,
              })}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid #333', fontSize: 13, color: '#aaa' }}>
          <div style={{ marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email}
          </div>
          <button onClick={handleSignOut} style={{ background: 'none', border: '1px solid #555', color: '#aaa', padding: '4px 12px', cursor: 'pointer', borderRadius: 4, fontSize: 13 }}>
            Sair
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32, background: '#f8f9fa' }}>
        {children}
      </main>
    </div>
  )
}
