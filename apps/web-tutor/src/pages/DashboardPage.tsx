import { Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'
import { colors, radius, spacing } from '@patafy/ui'

const ACTIONS = [
  {
    to: '/lojas',
    label: 'Encontrar Pet Shop',
    description: 'Descubra pet shops na sua cidade e agende serviços para o seu pet.',
    icon: '🗺️',
    color: colors.tealLight,
    accent: colors.teal,
  },
  {
    to: '/pets',
    label: 'Meus Pets',
    description: 'Gerencie os perfis dos seus pets, raça, porte e histórico.',
    icon: '🐾',
    color: '#FFF7ED',
    accent: colors.warning,
  },
  {
    to: '/agendamentos',
    label: 'Meus Agendamentos',
    description: 'Acompanhe e gerencie seus agendamentos de banho, tosa e mais.',
    icon: '📋',
    color: colors.infoBg,
    accent: colors.info,
  },
] as const

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Tutor'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div>
      <div style={{ marginBottom: spacing.xl }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: colors.textPrimary, marginBottom: 4 }}>
          {greeting}, {firstName}! 🐾
        </h1>
        <p style={{ fontSize: 15, color: colors.textMuted, margin: 0 }}>
          O que você quer fazer com o seu pet hoje?
        </p>
      </div>

      <div style={gridStyle}>
        {ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} style={cardStyle}>
            <div style={{ ...iconBadgeStyle, background: action.color }}>
              <span style={{ fontSize: 24 }}>{action.icon}</span>
            </div>
            <div style={{ fontSize: 17, fontWeight: 600, color: colors.textPrimary }}>
              {action.label}
            </div>
            <div style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 1.55, flex: 1 }}>
              {action.description}
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: action.accent }}>
              Acessar →
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: spacing.md,
} as const

const cardStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: spacing.sm,
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  textDecoration: 'none',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  minHeight: 200,
} as const

const iconBadgeStyle = {
  width: 52,
  height: 52,
  borderRadius: radius.md,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 4,
} as const
