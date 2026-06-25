import type { CSSProperties } from 'react'
import { NavLink } from 'react-router'
import { colors, spacing } from '../tokens.js'

export type NavItem = { to: string; label: string }

type Props = {
  title?: string
  navItems: NavItem[]
  userEmail: string
  onSignOut: () => void
  children: React.ReactNode
}

export function AdminLayout({ title = 'Patafy Admin', navItems, userEmail, onSignOut, children }: Props) {
  return (
    <div style={wrapStyle}>
      <aside style={sidebarStyle}>
        <div style={logoStyle}>{title}</div>
        <nav style={navStyle}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => navLinkStyle(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={footerStyle}>
          <div style={emailStyle} title={userEmail}>{userEmail}</div>
          <button onClick={onSignOut} style={signOutBtnStyle}>Sair</button>
        </div>
      </aside>
      <main style={mainStyle}>{children}</main>
    </div>
  )
}

const wrapStyle: CSSProperties = { display: 'flex', minHeight: '100vh' }
const sidebarStyle: CSSProperties = {
  width: 220,
  background: colors.primary,
  color: colors.white,
  padding: `${spacing.lg}px 0`,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
}
const logoStyle: CSSProperties = {
  padding: `0 ${spacing.md}px ${spacing.lg}px`,
  fontWeight: 700,
  fontSize: 18,
  borderBottom: `1px solid #333`,
}
const navStyle: CSSProperties = { flex: 1, marginTop: spacing.md }
const navLinkStyle = (isActive: boolean): CSSProperties => ({
  display: 'block',
  padding: `10px ${spacing.md}px`,
  color: isActive ? colors.white : colors.textMuted,
  background: isActive ? colors.primaryDark : 'transparent',
  textDecoration: 'none',
  fontSize: 14,
  transition: 'background 0.15s',
})
const footerStyle: CSSProperties = {
  padding: `${spacing.md}px ${spacing.md}px`,
  borderTop: '1px solid #333',
  fontSize: 13,
  color: colors.textMuted,
}
const emailStyle: CSSProperties = {
  marginBottom: spacing.sm,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}
const signOutBtnStyle: CSSProperties = {
  background: 'none',
  border: '1px solid #555',
  color: colors.textMuted,
  padding: `4px 12px`,
  cursor: 'pointer',
  borderRadius: 4,
  fontSize: 13,
}
const mainStyle: CSSProperties = { flex: 1, padding: spacing.xl, background: colors.bg, overflowY: 'auto' }
