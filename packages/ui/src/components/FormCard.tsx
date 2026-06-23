import type { CSSProperties } from 'react'
import { colors } from '../tokens.js'

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

export const btnPrimary: CSSProperties = { background: colors.primary, color: colors.white, border: 'none', padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }
export const btnSecondary: CSSProperties = { background: colors.white, color: '#333', border: `1px solid #ccc`, padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }
export const btnSmall: CSSProperties = { background: 'none', border: '1px solid #ccc', padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
export const inputStyle: CSSProperties = { display: 'block', padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14, width: 220 }
export const labelStyle: CSSProperties = { display: 'block', fontSize: 13, marginBottom: 4, color: colors.textSecondary }

const cardStyle: CSSProperties = { background: colors.white, border: `1px solid ${colors.border}`, borderRadius: 8, padding: 20, marginBottom: 24 }
const titleStyle: CSSProperties = { marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }
