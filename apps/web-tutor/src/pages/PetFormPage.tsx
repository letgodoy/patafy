import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  useMyPetsQuery, usePetQuery, useCreatePetMutation, useUpdatePetMutation,
  useTiposAnimalQuery, useRacasQuery, usePortesQuery, usePelagensQuery,
} from '@patafy/graphql-client'
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

export function PetFormPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: petData } = usePetQuery({ id: id! }, { enabled: isEdit })
  const { data: tiposData } = useTiposAnimalQuery({ ativo: true })
  const { data: portesData } = usePortesQuery({ ativo: true })
  const { data: pelagensData } = usePelagensQuery({ ativo: true })

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', tipoAnimalId: '', racaId: '', porteId: '', pelagemId: '', idade: '', peso: '', agressivo: false, cuidadosEspeciais: '' },
  })

  const tipoAnimalId = form.watch('tipoAnimalId')
  const { data: racasData } = useRacasQuery({ tipoAnimalId, ativo: true }, { enabled: !!tipoAnimalId })

  const createMutation = useCreatePetMutation({
    onSuccess: () => { qc.invalidateQueries({ queryKey: useMyPetsQuery.getKey() }); navigate('/pets') },
  })
  const updateMutation = useUpdatePetMutation({
    onSuccess: () => { qc.invalidateQueries({ queryKey: useMyPetsQuery.getKey() }); navigate('/pets') },
  })

  const pet = petData?.pet
  useEffect(() => {
    if (pet) {
      form.reset({
        nome: pet.nome,
        tipoAnimalId: pet.tipoAnimalId,
        racaId: pet.racaId ?? '',
        porteId: pet.porteId ?? '',
        pelagemId: pet.pelagemId ?? '',
        idade: pet.idade ?? '',
        peso: pet.peso ?? '',
        agressivo: pet.agressivo,
        cuidadosEspeciais: pet.cuidadosEspeciais ?? '',
      })
    }
  }, [pet?.id])

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      const input = {
        nome: data.nome,
        tipoAnimalId: data.tipoAnimalId,
        racaId: data.racaId || undefined,
        porteId: data.porteId || undefined,
        pelagemId: data.pelagemId || undefined,
        idade: data.idade !== '' ? Number(data.idade) : undefined,
        peso: data.peso !== '' ? Number(data.peso) : undefined,
        agressivo: data.agressivo,
        cuidadosEspeciais: data.cuidadosEspeciais?.trim() || undefined,
      }
      if (isEdit) {
        await updateMutation.mutateAsync({ id: id!, input })
      } else {
        await createMutation.mutateAsync({ input })
      }
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar' })
    }
  })

  const e = form.formState.errors
  const tipos = tiposData?.tiposAnimal ?? []
  const racas = racasData?.racas ?? []
  const portes = portesData?.portes ?? []
  const pelagens = pelagensData?.pelagens ?? []

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <PageHeader title={isEdit ? 'Editar Pet' : 'Novo Pet'} />
      <FormCard title={isEdit ? 'Dados do Pet' : 'Cadastrar Pet'} onSubmit={onSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Nome *</label>
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
            <textarea {...form.register('cuidadosEspeciais')} rows={3} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
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
            {form.formState.isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" onClick={() => navigate('/pets')} style={btnSecondary}>Cancelar</button>
        </div>
      </FormCard>
    </div>
  )
}
