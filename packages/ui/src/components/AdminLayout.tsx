import type { CSSProperties, ReactNode } from 'react'
import { NavLink } from 'react-router'
import { colors, spacing } from '../tokens.js'

export type NavItem = { to: string; label: string; section?: string }

type Props = {
  title?: string
  navItems: NavItem[]
  userEmail: string
  onSignOut: () => void
  children: ReactNode
}

export function AdminLayout({ title = 'Patafy', navItems, userEmail, onSignOut, children }: Props) {
  const sections: { title?: string; items: NavItem[] }[] = []
  for (const item of navItems) {
    const last = sections[sections.length - 1]
    if (!last || last.title !== item.section) {
      sections.push({ title: item.section, items: [item] })
    } else {
      last.items.push(item)
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={sidebarStyle}>
        <div style={logoAreaStyle}>
          <span style={{ color: colors.teal, fontSize: 10, lineHeight: 1 }}>◆</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>
            {title}
          </span>
        </div>
        <nav style={{ flex: 1, overflowY: 'auto', padding: '4px 0 16px' }}>
          {sections.map((sec, si) => (
            <div key={si} style={{ marginTop: si > 0 ? 4 : 0 }}>
              {sec.title && <div style={sectionLabelStyle}>{sec.title}</div>}
              {sec.items.map((item) => (
                <NavLink key={item.to} to={item.to} style={({ isActive }) => navLinkStyle(isActive)}>
                  {item.label}
                </NavLink>
              ))}
            </div>
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

const sidebarStyle: CSSProperties = {
  width: 240,
  background: colors.ink,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  position: 'sticky',
  top: 0,
  height: '100vh',
  overflowY: 'auto',
}

const logoAreaStyle: CSSProperties = {
  padding: `${spacing.lg}px ${spacing.md}px`,
  borderBottom: '1px solid rgba(255,255,255,0.07)',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: '#fff',
}

const sectionLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.28)',
  padding: `${spacing.md}px ${spacing.md}px 5px`,
}

const navLinkStyle = (isActive: boolean): CSSProperties => ({
  display: 'block',
  padding: `9px ${spacing.md}px`,
  paddingLeft: isActive ? spacing.md - 3 : spacing.md,
  color: isActive ? colors.teal : 'rgba(255,255,255,0.62)',
  background: isActive ? 'rgba(0,200,160,0.1)' : 'transparent',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: isActive ? 600 : 400,
  borderLeft: isActive ? `3px solid ${colors.teal}` : '3px solid transparent',
  transition: 'background 0.12s, color 0.12s',
})

const footerStyle: CSSProperties = {
  padding: spacing.md,
  borderTop: '1px solid rgba(255,255,255,0.07)',
}

const emailStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
  marginBottom: 10,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const signOutBtnStyle: CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.55)',
  padding: '5px 0',
  cursor: 'pointer',
  borderRadius: spacing.sm,
  fontSize: 13,
  width: '100%',
  textAlign: 'center',
}

const mainStyle: CSSProperties = {
  flex: 1,
  padding: `${spacing.xl}px`,
  background: colors.bg,
  overflowY: 'auto',
  minHeight: '100vh',
}
