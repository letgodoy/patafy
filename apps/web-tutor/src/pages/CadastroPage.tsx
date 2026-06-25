import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRegisterTutorMutation } from '@patafy/graphql-client'
import { useAuth } from '../contexts/AuthContext.js'

const schema = z.object({
  nome: z.string().min(1, 'Nome completo é obrigatório'),
  cpf: z.string().min(14, 'CPF inválido').max(14),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((d) => d.senha === d.confirmarSenha, { message: 'As senhas não coincidem', path: ['confirmarSenha'] })

type FormData = z.infer<typeof schema>

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
  const registerMutation = useRegisterTutorMutation()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', cpf: '', email: '', telefone: '', endereco: '', senha: '', confirmarSenha: '' },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await signUp(data.email, data.senha)
      await registerMutation.mutateAsync({
        input: { nome: data.nome, email: data.email, cpf: data.cpf, telefone: data.telefone || undefined, endereco: data.endereco || undefined },
      })
      navigate('/dashboard')
    } catch (err: unknown) {
      const code = (err as { response?: { errors?: { extensions?: { code?: string }; message: string }[] } })?.response?.errors?.[0]?.extensions?.code
      if (code === 'CPF_DUPLICATE') form.setError('cpf', { message: 'CPF já cadastrado.' })
      else if (code === 'EMAIL_DUPLICATE') form.setError('email', { message: 'E-mail já cadastrado.' })
      else if (code === 'CPF_INVALID') form.setError('cpf', { message: 'CPF inválido.' })
      else form.setError('root', { message: 'Erro ao criar conta. Verifique os dados e tente novamente.' })
    }
  })

  const e = form.formState.errors

  return (
    <main>
      <h1>Criar conta — Área do Tutor</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="nome">Nome completo</label>
          <input id="nome" type="text" {...form.register('nome')} />
          {e.nome && <p role="alert">{e.nome.message}</p>}
        </div>
        <div>
          <label htmlFor="cpf">CPF</label>
          <input id="cpf" type="text" placeholder="000.000.000-00" {...form.register('cpf', { onChange: (ev) => form.setValue('cpf', formatarCPF(ev.target.value), { shouldValidate: true }) })} />
          {e.cpf && <p role="alert">{e.cpf.message}</p>}
        </div>
        <div>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" {...form.register('email')} />
          {e.email && <p role="alert">{e.email.message}</p>}
        </div>
        <div>
          <label htmlFor="telefone">Telefone (opcional)</label>
          <input id="telefone" type="tel" {...form.register('telefone')} />
        </div>
        <div>
          <label htmlFor="endereco">Endereço (opcional)</label>
          <input id="endereco" type="text" {...form.register('endereco')} />
        </div>
        <div>
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" {...form.register('senha')} />
          {e.senha && <p role="alert">{e.senha.message}</p>}
        </div>
        <div>
          <label htmlFor="confirmarSenha">Confirmar senha</label>
          <input id="confirmarSenha" type="password" {...form.register('confirmarSenha')} />
          {e.confirmarSenha && <p role="alert">{e.confirmarSenha.message}</p>}
        </div>
        {e.root && <p role="alert">{e.root.message}</p>}
        <button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </main>
  )
}
