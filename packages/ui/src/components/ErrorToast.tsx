import { useEffect, useState } from 'react'

type Props = { message: string; onClose: () => void; duration?: number }

export function ErrorToast({ message, onClose, duration = 5000 }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onClose() }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#dc2626', color: '#fff', padding: '12px 20px',
      borderRadius: 8, fontSize: 14, maxWidth: 360,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={() => { setVisible(false); onClose() }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  )
}

export function SuccessToast({ message, onClose, duration = 3000 }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onClose() }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: '#16a34a', color: '#fff', padding: '12px 20px',
      borderRadius: 8, fontSize: 14, maxWidth: 360,
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={() => { setVisible(false); onClose() }} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  )
}
