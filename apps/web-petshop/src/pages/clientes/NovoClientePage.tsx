import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateTutorAssistedMutation } from '@patafy/graphql-client'
import { PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  cpf: z.string().min(14, 'CPF inválido').max(14),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
})
type FormData = z.infer<typeof schema>

function formatarCPF(v: string) {
  return v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2').slice(0, 14)
}

export function NovoClientePage() {
  const navigate = useNavigate()
  const mutation = useCreateTutorAssistedMutation()
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', email: '', cpf: '', telefone: '', endereco: '' },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const tutor = await mutation.mutateAsync({
        input: { nome: data.nome, email: data.email, cpf: data.cpf, telefone: data.telefone || undefined, endereco: data.endereco || undefined },
      })
      navigate(`/clientes/${tutor.createTutorAssisted.id}/pets/novo`)
    } catch (err: unknown) {
      const code = (err as { response?: { errors?: { extensions?: { code?: string }; message: string }[] } })?.response?.errors?.[0]?.extensions?.code
      if (code === 'CPF_DUPLICATE') form.setError('cpf', { message: 'CPF já cadastrado.' })
      else if (code === 'EMAIL_DUPLICATE') form.setError('email', { message: 'E-mail já cadastrado.' })
      else if (code === 'CPF_INVALID') form.setError('cpf', { message: 'CPF inválido.' })
      else form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao cadastrar.' })
    }
  })

  const e = form.formState.errors

  return (
    <div>
      <PageHeader title="Novo Cliente" />
      <FormCard title="Cadastro Assistido de Tutor" onSubmit={onSubmit}>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#555' }}>
          O tutor receberá um e-mail para definir sua senha e acessar o portal.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Nome completo *</label>
            <input {...form.register('nome')} style={{ ...inputStyle, width: '100%' }} />
            {e.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.nome.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>E-mail *</label>
            <input type="email" {...form.register('email')} style={inputStyle} />
            {e.email && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.email.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>CPF *</label>
            <input placeholder="000.000.000-00" {...form.register('cpf', { onChange: (ev) => form.setValue('cpf', formatarCPF(ev.target.value), { shouldValidate: true }) })} style={inputStyle} />
            {e.cpf && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.cpf.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input {...form.register('telefone')} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Endereço</label>
            <input {...form.register('endereco')} style={{ ...inputStyle, width: '100%' }} />
          </div>
        </div>
        {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" style={btnPrimary} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Cadastrando...' : 'Cadastrar e adicionar pet'}
          </button>
          <button type="button" onClick={() => navigate('/clientes/buscar')} style={btnSecondary}>Cancelar</button>
        </div>
      </FormCard>
    </div>
  )
}
