import { useAuth } from '../contexts/AuthContext.js'

export function AcessoNegadoPage() {
  const { signOut } = useAuth()

  return (
    <main>
      <h1>Acesso negado</h1>
      <p>Sua conta não tem permissão de administrador do sistema.</p>
      <button onClick={signOut}>Sair</button>
    </main>
  )
}
