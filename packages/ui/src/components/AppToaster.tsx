import { createToaster, Toaster, Toast, ToastRoot, ToastTitle, ToastDescription, ToastCloseTrigger } from '@ark-ui/react'

export const toaster = createToaster({ placement: 'bottom-end', max: 5 })

const TYPE_COLORS: Record<string, { bg: string; border: string }> = {
  error:   { bg: '#fef2f2', border: '#fca5a5' },
  success: { bg: '#f0fdf4', border: '#86efac' },
  info:    { bg: '#eff6ff', border: '#93c5fd' },
  warning: { bg: '#fffbeb', border: '#fcd34d' },
}

export function AppToaster() {
  return (
    <Toaster toaster={toaster}>
      {(toast) => {
        const colors = TYPE_COLORS[toast.type ?? 'info'] ?? TYPE_COLORS['info']!
        return (
          <ToastRoot
            key={toast.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 8,
              padding: '12px 16px',
              minWidth: 280,
              maxWidth: 380,
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginBottom: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <ToastTitle style={{ fontWeight: 600, fontSize: 14, color: '#1f2937' }} />
              <ToastCloseTrigger
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1, color: '#9ca3af', padding: 0, flexShrink: 0 }}
                aria-label="Fechar"
              >
                ×
              </ToastCloseTrigger>
            </div>
            <ToastDescription style={{ fontSize: 13, color: '#374151' }} />
          </ToastRoot>
        )
      }}
    </Toaster>
  )
}
