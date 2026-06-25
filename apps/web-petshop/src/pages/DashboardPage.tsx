import { useAuth } from '../contexts/AuthContext.js'

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <>
      <h1 style={{ marginTop: 0 }}>Dashboard — Área do Pet Shop</h1>
      <p>Bem-vindo, {user?.displayName ?? user?.email}</p>
      <p style={{ color: '#666', fontSize: 14 }}>Use o menu lateral para acessar configurações, equipe e bloqueios de agenda.</p>
    </>
  )
}
