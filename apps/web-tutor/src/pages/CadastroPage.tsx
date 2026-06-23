import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext.js'
import { gqlClient } from '../lib/graphql-client.js'

const REGISTER_TUTOR = /* GraphQL */ `
  mutation RegisterTutor($input: RegisterTutorInput!) {
    registerTutor(input: $input) { id nome email }
  }
`

function formatarCPF(valor: string) {
  return valor
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    .slice(0, 14)
}

export function CadastroPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', cpf: '', telefone: '', endereco: '', senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const registerMutation = useMutation({
    mutationFn: (vars: { input: Record<string, unknown> }) => gqlClient.request(REGISTER_TUTOR, vars),
  })

  const set = (campo: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = campo === 'cpf' ? formatarCPF(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [campo]: valor }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    if (form.senha !== form.confirmarSenha) { setErro('As senhas não coincidem.'); return }
    if (form.senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    try {
      await signUp(form.email, form.senha)
      await registerMutation.mutateAsync({
        input: { nome: form.nome, email: form.email, cpf: form.cpf, telefone: form.telefone || undefined, endereco: form.endereco || undefined },
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const code = (err as { response?: { errors?: { extensions?: { code?: string }; message: string }[] } })?.response?.errors?.[0]?.extensions?.code
      if (code === 'CPF_DUPLICATE') setErro('CPF já cadastrado.')
      else if (code === 'EMAIL_DUPLICATE') setErro('E-mail já cadastrado.')
      else if (code === 'CPF_INVALID') setErro('CPF inválido.')
      else setErro('Erro ao criar conta. Verifique os dados e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main>
      <h1>Criar conta — Área do Tutor</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" type="text" value={form.nome} onChange={set('nome')} required />
        </div>
        <div>
          <label htmlFor="cpf">CPF</label>
          <input id="cpf" type="text" value={form.cpf} onChange={set('cpf')} placeholder="000.000.000-00" required />
        </div>
        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label htmlFor="telefone">Telefone (opcional)</label>
          <input id="telefone" type="tel" value={form.telefone} onChange={set('telefone')} />
        </div>
        <div>
          <label htmlFor="endereco">Endereço (opcional)</label>
          <input id="endereco" type="text" value={form.endereco} onChange={set('endereco')} />
        </div>
        <div>
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" value={form.senha} onChange={set('senha')} required />
        </div>
        <div>
          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <input id="confirmarSenha" type="password" value={form.confirmarSenha} onChange={set('confirmarSenha')} required />
        </div>
        {erro && <p role="alert">{erro}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </main>
  )
}
