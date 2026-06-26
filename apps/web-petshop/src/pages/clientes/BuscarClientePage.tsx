import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchTutorQuery } from '@patafy/graphql-client'
import { PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle, colors } from '@patafy/ui'

function formatarCPF(cpf: string) {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const schema = z.object({
  busca: z.string().min(1, 'Informe CPF ou e-mail'),
  tipo: z.enum(['cpf', 'email']),
})
type FormData = z.infer<typeof schema>

export function BuscarClientePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState<{ cpf?: string; email?: string } | null>(null)

  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { busca: '', tipo: 'cpf' } })

  const { data, isLoading, isFetching } = useSearchTutorQuery(
    { cpf: query?.cpf, email: query?.email },
    { enabled: !!query },
  )

  const onSubmit = form.handleSubmit((data) => {
    const v = data.busca.trim()
    setQuery(data.tipo === 'cpf' ? { cpf: v } : { email: v })
  })

  const tutor = data?.searchTutor
  const e = form.formState.errors

  return (
    <div>
      <PageHeader title="Buscar Cliente" action={<button onClick={() => navigate('/clientes/novo')} style={btnPrimary}>+ Cadastrar Novo</button>} />
      <FormCard title="Busca por CPF ou E-mail" onSubmit={onSubmit}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={labelStyle}>Buscar por</label>
            <select {...form.register('tipo')} style={inputStyle}>
              <option value="cpf">CPF</option>
              <option value="email">E-mail</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={labelStyle}>Valor *</label>
            <input {...form.register('busca')} placeholder="000.000.000-00 ou email@..." style={{ ...inputStyle, width: '100%' }} />
            {e.busca && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.busca.message}</p>}
          </div>
          <button type="submit" style={btnPrimary} disabled={isLoading || isFetching}>Buscar</button>
        </div>
      </FormCard>

      {query && !isLoading && !isFetching && (
        <div style={{ marginTop: 16 }}>
          {!tutor ? (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24, textAlign: 'center' }}>
              <p style={{ color: '#666', margin: '0 0 16px' }}>Nenhum cliente encontrado.</p>
              <button onClick={() => navigate('/clientes/novo')} style={btnPrimary}>Cadastrar como novo cliente</button>
            </div>
          ) : (
            <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Cliente encontrado</h3>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', margin: '0 0 20px' }}>
                {[['Nome', tutor.nome], ['E-mail', tutor.email], ['CPF', formatarCPF(tutor.cpf)], ['Telefone', tutor.telefone ?? '—']].map(([k, v]) => (
                  <div key={k as string}>
                    <dt style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>{k}</dt>
                    <dd style={{ margin: 0, fontSize: 14 }}>{v}</dd>
                  </div>
                ))}
              </dl>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => navigate(`/clientes/${tutor.id}/pets/novo`)} style={btnPrimary}>+ Cadastrar Pet</button>
                <button onClick={() => form.reset()} style={btnSecondary}>Nova Busca</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
