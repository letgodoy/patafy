import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'
import { colors, radius, spacing } from '@patafy/ui'

const QUICK_ACTIONS = [
  {
    to: '/petshops',
    label: 'Pet Shops',
    description: 'Gerencie os pet shops cadastrados na plataforma.',
    icon: '🏪',
    color: colors.tealLight,
    accent: colors.teal,
  },
  {
    to: '/admins',
    label: 'Administradores',
    description: 'Controle os usuários com acesso administrativo ao sistema.',
    icon: '👤',
    color: colors.infoBg,
    accent: colors.info,
  },
  {
    to: '/catalogo/tipos',
    label: 'Catálogo',
    description: 'Gerencie tipos de animal, raças, portes e pelagens disponíveis.',
    icon: '📚',
    color: colors.warningBg,
    accent: colors.warning,
  },
  {
    to: '/auditoria',
    label: 'Auditoria',
    description: 'Acompanhe todas as operações realizadas na plataforma.',
    icon: '🔍',
    color: '#F5F3FF',
    accent: '#7C3AED',
  },
] as const

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Admin'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: colors.textPrimary, marginBottom: 4 }}>
          {greeting}, {firstName}!
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          Painel de administração Patafy
        </p>
      </div>

      <div style={gridStyle}>
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} style={cardStyle}>
            <div style={{ ...iconBadgeStyle, background: action.color }}>
              <span style={{ fontSize: 22 }}>{action.icon}</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, marginBottom: 4 }}>
                {action.label}
              </div>
              <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>
                {action.description}
              </div>
            </div>
            <div style={{ marginTop: 'auto', paddingTop: spacing.md }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: action.accent }}>
                Abrir →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: spacing.md,
} as const

const cardStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.md,
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  textDecoration: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  minHeight: 180,
} as const

const iconBadgeStyle = {
  width: 48,
  height: 48,
  borderRadius: radius.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const
