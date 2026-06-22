import { useAuth } from '../contexts/AuthContext.js'

export function SemAcessoPage() {
  const { signOut } = useAuth()

  return (
    <main>
      <h1>Sem acesso</h1>
      <p>Sua conta não está vinculada a nenhum pet shop. Entre em contato com o responsável pelo estabelecimento.</p>
      <button onClick={signOut}>Sair</button>
    </main>
  )
}
