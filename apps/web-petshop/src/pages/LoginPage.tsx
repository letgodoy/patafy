import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await signIn(email, senha)
      navigate('/dashboard')
    } catch {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setErro('')
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch {
      setErro('Não foi possível entrar com Google.')
    }
  }

  return (
    <main>
      <h1>Entrar — Área do Pet Shop</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        {erro && <p role="alert">{erro}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <button onClick={handleGoogle}>Entrar com Google</button>
    </main>
  )
}
