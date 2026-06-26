import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreatePetForTutorMutation, useTiposAnimalQuery, useRacasQuery, usePortesQuery, usePelagensQuery } from '@patafy/graphql-client'
import { PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle } from '@patafy/ui'

const schema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipoAnimalId: z.string().min(1, 'Tipo de animal é obrigatório'),
  racaId: z.string().optional(),
  porteId: z.string().optional(),
  pelagemId: z.string().optional(),
  idade: z.coerce.number().int().min(0).optional().or(z.literal('')),
  peso: z.coerce.number().min(0).optional().or(z.literal('')),
  agressivo: z.boolean(),
  cuidadosEspeciais: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function NovoPetClientePage() {
  const { tutorProfileId } = useParams<{ tutorProfileId: string }>()
  const navigate = useNavigate()

  const { data: tiposData } = useTiposAnimalQuery({ ativo: true })
  const { data: portesData } = usePortesQuery({ ativo: true })
  const { data: pelagensData } = usePelagensQuery({ ativo: true })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', tipoAnimalId: '', racaId: '', porteId: '', pelagemId: '', idade: '', peso: '', agressivo: false, cuidadosEspeciais: '' },
  })

  const tipoAnimalId = form.watch('tipoAnimalId')
  const { data: racasData } = useRacasQuery({ tipoAnimalId, ativo: true }, { enabled: !!tipoAnimalId })

  const mutation = useCreatePetForTutorMutation()

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await mutation.mutateAsync({
        tutorProfileId: tutorProfileId!,
        input: {
          nome: data.nome,
          tipoAnimalId: data.tipoAnimalId,
          racaId: data.racaId || undefined,
          porteId: data.porteId || undefined,
          pelagemId: data.pelagemId || undefined,
          idade: data.idade !== '' ? Number(data.idade) : undefined,
          peso: data.peso !== '' ? Number(data.peso) : undefined,
          agressivo: data.agressivo,
          cuidadosEspeciais: data.cuidadosEspeciais?.trim() || undefined,
        },
      })
      navigate('/clientes/buscar')
    } catch (err: unknown) {
      const msg = (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao cadastrar pet.'
      form.setError('root', { message: msg })
    }
  })

  const e = form.formState.errors
  const tipos = tiposData?.tiposAnimal ?? []
  const racas = racasData?.racas ?? []
  const portes = portesData?.portes ?? []
  const pelagens = pelagensData?.pelagens ?? []

  return (
    <div>
      <PageHeader title="Cadastrar Pet do Cliente" />
      <FormCard title="Dados do Pet" onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Nome do Pet *</label>
            <input {...form.register('nome')} style={{ ...inputStyle, width: '100%' }} />
            {e.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.nome.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Tipo de Animal *</label>
            <select {...form.register('tipoAnimalId')} style={inputStyle}>
              <option value="">Selecione...</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
            {e.tipoAnimalId && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.tipoAnimalId.message}</p>}
          </div>
          <div>
            <label style={labelStyle}>Raça</label>
            <select {...form.register('racaId')} style={inputStyle} disabled={!tipoAnimalId}>
              <option value="">Nenhuma</option>
              {racas.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Porte</label>
            <select {...form.register('porteId')} style={inputStyle}>
              <option value="">Nenhum</option>
              {portes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Pelagem</label>
            <select {...form.register('pelagemId')} style={inputStyle}>
              <option value="">Nenhuma</option>
              {pelagens.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Idade (anos)</label>
            <input type="number" min={0} {...form.register('idade')} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Peso (kg)</label>
            <input type="number" min={0} step="0.1" {...form.register('peso')} style={inputStyle} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Cuidados Especiais</label>
            <textarea {...form.register('cuidadosEspeciais')} rows={2} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" {...form.register('agressivo')} />
              Pet agressivo (requer atenção especial)
            </label>
          </div>
        </div>
        {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button type="submit" style={btnPrimary} disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Salvando...' : 'Cadastrar Pet'}
          </button>
          <button type="button" onClick={() => navigate(-1)} style={btnSecondary}>Cancelar</button>
        </div>
      </FormCard>
    </div>
  )
}
