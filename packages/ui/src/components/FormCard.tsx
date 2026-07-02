import type { CSSProperties } from 'react'
import { colors, radius, spacing } from '../tokens.js'

type Props = {
  title?: string
  children: React.ReactNode
  onSubmit?: (e: React.FormEvent) => void
}

export function FormCard({ title, children, onSubmit }: Props) {
  const content = (
    <div style={cardStyle}>
      {title && <h3 style={titleStyle}>{title}</h3>}
      {children}
    </div>
  )
  if (onSubmit) return <form onSubmit={onSubmit}>{content}</form>
  return content
}

export const btnPrimary: CSSProperties = {
  background: colors.teal,
  color: colors.ink,
  border: 'none',
  padding: '9px 20px',
  borderRadius: radius.sm,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  transition: 'opacity 0.12s',
}

export const btnSecondary: CSSProperties = {
  background: colors.white,
  color: colors.textPrimary,
  border: `1px solid ${colors.border}`,
  padding: '9px 20px',
  borderRadius: radius.sm,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
  transition: 'background 0.12s',
}

export const btnDanger: CSSProperties = {
  background: colors.dangerBg,
  color: colors.danger,
  border: `1px solid #FECACA`,
  padding: '9px 20px',
  borderRadius: radius.sm,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 500,
}

export const btnSmall: CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  padding: '4px 12px',
  borderRadius: radius.sm,
  cursor: 'pointer',
  fontSize: 13,
}

export const inputStyle: CSSProperties = {
  display: 'block',
  padding: '8px 12px',
  border: `1px solid ${colors.border}`,
  borderRadius: radius.sm,
  fontSize: 14,
  width: 220,
  background: colors.white,
  color: colors.textPrimary,
  outline: 'none',
  transition: 'border-color 0.12s, box-shadow 0.12s',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: spacing.xs,
  color: colors.textSecondary,
}

const cardStyle: CSSProperties = {
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: radius.md,
  padding: spacing.lg,
  marginBottom: spacing.lg,
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
}

const titleStyle: CSSProperties = {
  marginTop: 0,
  marginBottom: spacing.md,
  fontSize: 16,
  fontWeight: 600,
  color: colors.textPrimary,
}
