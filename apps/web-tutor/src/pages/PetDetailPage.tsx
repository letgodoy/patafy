import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  usePetQuery, useDeletePetMutation, useMyPetTutorConvitesQuery,
  useCreatePetTutorConviteMutation, useRevokePetTutorConviteMutation,
} from '@patafy/graphql-client'
import { PageHeader, FormCard, btnPrimary, btnSecondary, inputStyle, labelStyle, colors } from '@patafy/ui'

const conviteSchema = z.object({ email: z.string().email('E-mail inválido') })
type ConviteForm = z.infer<typeof conviteSchema>

export function PetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [mostrarConvite, setMostrarConvite] = useState(false)
  const [mensagem, setMensagem] = useState('')

  const { data, isLoading, error } = usePetQuery({ id: id! })
  const { data: convitesData } = useMyPetTutorConvitesQuery()
  const deleteMutation = useDeletePetMutation({
    onSuccess: () => { qc.invalidateQueries({ queryKey: usePetQuery.getKey({ id: id! }) }); navigate('/pets') },
  })
  const createConviteMutation = useCreatePetTutorConviteMutation({
    onSuccess: () => qc.invalidateQueries({ queryKey: useMyPetTutorConvitesQuery.getKey() }),
  })
  const revokeConviteMutation = useRevokePetTutorConviteMutation({
    onSuccess: () => qc.invalidateQueries({ queryKey: useMyPetTutorConvitesQuery.getKey() }),
  })

  const form = useForm<ConviteForm>({ resolver: zodResolver(conviteSchema) })

  if (isLoading) return <div style={{ padding: 24 }}>Carregando...</div>
  if (!!error || !data?.pet) return <div style={{ padding: 24, color: 'red' }}>Pet não encontrado.</div>

  const pet = data.pet
  const convitesDoPet = (convitesData?.myPetTutorConvites ?? []).filter((c) => c.petId === id)
  const pendentes = convitesDoPet.filter((c) => c.status === 'pendente')

  const onConvite = form.handleSubmit(async (data) => {
    try {
      await createConviteMutation.mutateAsync({ petId: id!, convidadoEmail: data.email })
      setMensagem(`Convite enviado para ${data.email}. O link de aceite deve ser compartilhado manualmente por ora.`)
      form.reset()
      setMostrarConvite(false)
    } catch (err: unknown) {
      form.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao enviar convite' })
    }
  })

  const handleDelete = async () => {
    if (!confirm(`Remover "${pet.nome}" permanentemente? Esta ação não pode ser desfeita.`)) return
    await deleteMutation.mutateAsync({ id: id! })
  }

  const e = form.formState.errors

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <PageHeader title={pet.nome} action={
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to={`/pets/${id}/editar`} style={{ padding: '8px 14px', border: `1px solid ${colors.border}`, borderRadius: 4, textDecoration: 'none', fontSize: 13 }}>Editar</Link>
          <button onClick={handleDelete} style={{ padding: '8px 14px', border: '1px solid #fca5a5', borderRadius: 4, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#c00' }}>Remover</button>
        </div>
      } />

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15 }}>Informações</h3>
        <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', margin: 0 }}>
          {[
            ['Tipo', pet.tipoAnimal?.nome],
            ['Idade', pet.idade ? `${pet.idade} anos` : '—'],
            ['Peso', pet.peso ? `${pet.peso} kg` : '—'],
            ['Agressivo', pet.agressivo ? 'Sim ⚠' : 'Não'],
          ].map(([k, v]) => (
            <div key={k as string}>
              <dt style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>{k}</dt>
              <dd style={{ margin: 0, fontSize: 14 }}>{v ?? '—'}</dd>
            </div>
          ))}
        </dl>
        {pet.cuidadosEspeciais && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 4px' }}>Cuidados Especiais</p>
            <p style={{ margin: 0, fontSize: 14 }}>{pet.cuidadosEspeciais}</p>
          </div>
        )}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Tutores ({pet.tutores.length})</h3>
          <button onClick={() => setMostrarConvite(true)} style={{ ...btnPrimary, fontSize: 13, padding: '6px 12px' }}>+ Convidar</button>
        </div>
        {pet.tutores.map((t) => (
          <div key={t.tutorProfileId} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: `1px solid ${colors.border}` }}>
            <span style={{ fontSize: 14 }}>{t.nome} <span style={{ color: '#666', fontSize: 12 }}>({t.email})</span></span>
            <span style={{ fontSize: 12, color: t.tipo === 'responsavel' ? colors.primary : '#666', textTransform: 'capitalize' }}>{t.tipo}</span>
          </div>
        ))}
        {pendentes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, color: '#666', margin: '0 0 8px' }}>Convites pendentes:</p>
            {pendentes.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderTop: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: 13 }}>{c.convidadoEmail}</span>
                <button onClick={() => revokeConviteMutation.mutateAsync({ id: c.id })} style={{ fontSize: 12, color: '#c00', background: 'none', border: 'none', cursor: 'pointer' }}>Revogar</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {mostrarConvite && (
        <FormCard title="Convidar Segundo Tutor" onSubmit={onConvite}>
          <div>
            <label style={labelStyle}>E-mail do tutor a convidar *</label>
            <input type="email" {...form.register('email')} style={{ ...inputStyle, width: '100%' }} placeholder="email@exemplo.com" />
            {e.email && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{e.email.message}</p>}
          </div>
          {e.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{e.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary} disabled={form.formState.isSubmitting}>Enviar Convite</button>
            <button type="button" onClick={() => { setMostrarConvite(false); form.reset() }} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      {mensagem && <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: 16, marginTop: 16, fontSize: 14 }}>{mensagem}</div>}
    </div>
  )
}
