import { useAuth } from '../contexts/AuthContext.js'

export function DashboardPage() {
  const { user, signOut } = useAuth()

  return (
    <main>
      <h1>Dashboard — Administração Patafy</h1>
      <p>Bem-vindo, {user?.displayName ?? user?.email}</p>
      <button onClick={signOut}>Sair</button>
    </main>
  )
}
