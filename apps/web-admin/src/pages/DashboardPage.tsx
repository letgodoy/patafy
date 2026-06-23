import { useAuth } from '../contexts/AuthContext.js'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard — Administração Patafy</h1>
      <p>Bem-vindo, {user?.displayName ?? user?.email}</p>
      <p style={{ color: '#666', fontSize: 14 }}>Use o menu lateral para gerenciar o catálogo e os administradores.</p>
    </>
  )
}
