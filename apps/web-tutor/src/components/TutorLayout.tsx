import { Outlet, useNavigate, NavLink } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'
import { colors, radius, spacing } from '@patafy/ui'
import type { CSSProperties } from 'react'

export function TutorLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Tutor'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.bg }}>
      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <NavLink to="/dashboard" style={logoStyle}>
            <span style={{ color: colors.teal, fontSize: 10 }}>◆</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em', color: colors.textPrimary }}>
              Patafy
            </span>
          </NavLink>

          <nav style={navStyle}>
            <NavLink to="/lojas" style={({ isActive }) => navLinkStyle(isActive)}>Lojas</NavLink>
            <NavLink to="/pets" style={({ isActive }) => navLinkStyle(isActive)}>Meus Pets</NavLink>
            <NavLink to="/agendamentos" style={({ isActive }) => navLinkStyle(isActive)}>Agendamentos</NavLink>
          </nav>

          <div style={userAreaStyle}>
            <span style={userNameStyle}>{displayName}</span>
            <button onClick={handleSignOut} style={signOutStyle}>Sair</button>
          </div>
        </div>
      </header>

      <main style={mainStyle}>
        <Outlet />
      </main>
    </div>
  )
}

const headerStyle: CSSProperties = {
  background: colors.white,
  borderBottom: `1px solid ${colors.border}`,
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

const headerInnerStyle: CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
  padding: `0 ${spacing.lg}px`,
  height: 56,
  display: 'flex',
  alignItems: 'center',
  gap: spacing.xl,
}

const logoStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  textDecoration: 'none',
  flexShrink: 0,
}

const navStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  flex: 1,
}

const navLinkStyle = (isActive: boolean): CSSProperties => ({
  padding: '6px 12px',
  borderRadius: radius.sm,
  fontSize: 14,
  fontWeight: isActive ? 600 : 400,
  color: isActive ? colors.teal : colors.textSecondary,
  background: isActive ? colors.tealLight : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.12s',
})

const userAreaStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: spacing.sm,
  flexShrink: 0,
}

const userNameStyle: CSSProperties = {
  fontSize: 13,
  color: colors.textMuted,
  maxWidth: 140,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const signOutStyle: CSSProperties = {
  background: 'none',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '5px 14px',
  borderRadius: radius.sm,
  fontSize: 13,
  cursor: 'pointer',
}

const mainStyle: CSSProperties = {
  flex: 1,
  maxWidth: 1100,
  margin: '0 auto',
  width: '100%',
  padding: `${spacing.xl}px ${spacing.lg}px`,
}
