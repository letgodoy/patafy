import type { CSSProperties } from 'react'

const SHIMMER_CSS = `
@keyframes patafy-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

type Props = {
  width?: string | number
  height?: string | number
  borderRadius?: number
  style?: CSSProperties
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 6, style }: Props) {
  return (
    <>
      <style>{SHIMMER_CSS}</style>
      <div
        style={{
          width,
          height,
          borderRadius,
          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
          backgroundSize: '200% 100%',
          animation: 'patafy-skeleton-shimmer 1.4s ease infinite',
          ...style,
        }}
      />
    </>
  )
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16 }}>
      <Skeleton height={18} width="60%" style={{ marginBottom: 12 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height={13} style={{ marginBottom: 8, width: i === lines - 1 ? '40%' : '100%' }} />
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: rows }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  )
}
