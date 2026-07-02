import type { CSSProperties } from 'react'
import { colors, spacing } from '../tokens.js'

type Props = {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: Props) {
  return (
    <div style={headerStyle}>
      <div>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

const headerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: spacing.lg,
  paddingBottom: spacing.md,
  borderBottom: `1px solid ${colors.border}`,
}

const titleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  color: colors.textPrimary,
  letterSpacing: '-0.02em',
}

const subtitleStyle: CSSProperties = {
  margin: '4px 0 0',
  fontSize: 14,
  color: colors.textMuted,
}
