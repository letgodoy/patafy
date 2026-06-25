import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useListPetShopsQuery, useCreatePetShopMutation, useCreatePetShopOwnerMutation, useDeactivatePetShopMutation } from '@patafy/graphql-client'
import type { PetShop } from '@patafy/graphql-client'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

type PetShopRow = Pick<PetShop, 'id' | 'nomeExibicao' | 'cnpj' | 'cidade' | 'estado' | 'email' | 'ativo' | 'createdAt'> & {
  configJson: { slug?: string | null }
}

const petShopSchema = z.object({
  nomeExibicao: z.string().min(1, 'Nome é obrigatório'),
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  endereco: z.string().min(1, 'Endereço é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  estado: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  telefone: z.string().optional(),
  email: z.string().email('E-mail inválido'),
})
const ownerSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  cpf: z.string().min(11, 'CPF inválido'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})
type PetShopForm = z.infer<typeof petShopSchema>
type OwnerForm = z.infer<typeof ownerSchema>
type Step = 'petshop' | 'owner' | null

export function PetShopsPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useListPetShopsQuery()
  const invalidate = () => qc.invalidateQueries({ queryKey: useListPetShopsQuery.getKey() })
  const createPetShopMutation = useCreatePetShopMutation()
  const createOwnerMutation = useCreatePetShopOwnerMutation({ onSuccess: invalidate })
  const deactivateMutation = useDeactivatePetShopMutation({ onSuccess: invalidate })

  const [step, setStep] = useState<Step>(null)
  const [newPetShopId, setNewPetShopId] = useState('')
  const [sucesso, setSucesso] = useState('')

  const psForm = useForm<PetShopForm>({ resolver: zodResolver(petShopSchema) })
  const ownerForm = useForm<OwnerForm>({ resolver: zodResolver(ownerSchema) })

  const resetAll = () => { setStep(null); setNewPetShopId(''); psForm.reset(); ownerForm.reset() }

  const onSubmitPetShop = psForm.handleSubmit(async (data) => {
    try {
      const result = await createPetShopMutation.mutateAsync({
        input: { ...data, estado: data.estado.toUpperCase(), telefone: data.telefone || undefined },
      })
      setNewPetShopId(result.createPetShop.id)
      setStep('owner')
    } catch (err: unknown) {
      psForm.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar pet shop' })
    }
  })

  const onSubmitOwner = ownerForm.handleSubmit(async (data) => {
    try {
      await createOwnerMutation.mutateAsync({
        input: { petshopId: newPetShopId, ...data, telefone: data.telefone || undefined },
      })
      setSucesso(`Pet shop criado com sucesso! Owner: ${data.email}`)
      resetAll()
    } catch (err: unknown) {
      ownerForm.setError('root', { message: (err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar owner' })
    }
  })

  const handleDeactivate = async (ps: PetShopRow) => {
    if (!confirm(`Desativar "${ps.nomeExibicao}"?`)) return
    await deactivateMutation.mutateAsync({ id: ps.id })
  }

  const columns: Column<PetShopRow>[] = [
    { key: 'nome', header: 'Nome', render: (ps) => ps.nomeExibicao },
    { key: 'cidade', header: 'Cidade / Estado', render: (ps) => `${ps.cidade} / ${ps.estado}` },
    { key: 'slug', header: 'Slug', render: (ps) => ps.configJson?.slug ?? '—' },
    { key: 'email', header: 'E-mail', render: (ps) => ps.email },
    { key: 'status', header: 'Status', width: 90, render: (ps) => <span style={{ color: ps.ativo ? 'green' : '#999' }}>{ps.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 120,
      render: (ps) => ps.ativo ? <button onClick={() => handleDeactivate(ps)} style={{ ...btnSmall, color: '#c00' }}>Desativar</button> : null,
    },
  ]

  const f = psForm.formState.errors
  const o = ownerForm.formState.errors

  return (
    <>
      <PageHeader title="Pet Shops" action={step === null ? <button onClick={() => setStep('petshop')} style={btnPrimary}>+ Novo Pet Shop</button> : undefined} />
      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>{sucesso}</p>}

      {step === 'petshop' && (
        <FormCard title="Novo Pet Shop (1/2)" onSubmit={onSubmitPetShop}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome de exibição *</label><input {...psForm.register('nomeExibicao')} style={inputStyle} />{f.nomeExibicao && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.nomeExibicao.message}</p>}</div>
            <div><label style={labelStyle}>Razão social *</label><input {...psForm.register('razaoSocial')} style={inputStyle} />{f.razaoSocial && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.razaoSocial.message}</p>}</div>
            <div><label style={labelStyle}>CNPJ *</label><input {...psForm.register('cnpj')} placeholder="00.000.000/0000-00" style={inputStyle} />{f.cnpj && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.cnpj.message}</p>}</div>
            <div><label style={labelStyle}>Endereço *</label><input {...psForm.register('endereco')} style={inputStyle} />{f.endereco && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.endereco.message}</p>}</div>
            <div><label style={labelStyle}>Cidade *</label><input {...psForm.register('cidade')} style={inputStyle} />{f.cidade && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.cidade.message}</p>}</div>
            <div><label style={labelStyle}>Estado (UF) *</label><input {...psForm.register('estado')} maxLength={2} placeholder="SP" style={{ ...inputStyle, width: 80 }} />{f.estado && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.estado.message}</p>}</div>
            <div><label style={labelStyle}>Telefone</label><input {...psForm.register('telefone')} style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail *</label><input type="email" {...psForm.register('email')} style={inputStyle} />{f.email && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{f.email.message}</p>}</div>
          </div>
          {f.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{f.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Próximo: Criar Owner</button>
            <button type="button" onClick={resetAll} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      {step === 'owner' && (
        <FormCard title="Criar Owner (2/2)" onSubmit={onSubmitOwner}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>Pet shop criado. Agora crie o owner responsável pela loja.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome *</label><input {...ownerForm.register('nome')} style={inputStyle} />{o.nome && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{o.nome.message}</p>}</div>
            <div><label style={labelStyle}>CPF *</label><input {...ownerForm.register('cpf')} placeholder="000.000.000-00" style={inputStyle} />{o.cpf && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{o.cpf.message}</p>}</div>
            <div><label style={labelStyle}>E-mail *</label><input type="email" {...ownerForm.register('email')} style={inputStyle} />{o.email && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{o.email.message}</p>}</div>
            <div><label style={labelStyle}>Telefone</label><input {...ownerForm.register('telefone')} style={inputStyle} /></div>
            <div><label style={labelStyle}>Senha *</label><input type="password" {...ownerForm.register('senha')} style={inputStyle} />{o.senha && <p style={{ color: 'red', fontSize: 13, margin: '4px 0 0' }}>{o.senha.message}</p>}</div>
          </div>
          {o.root && <p style={{ color: 'red', margin: '8px 0 0' }}>{o.root.message}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Criar Owner e Finalizar</button>
            <button type="button" onClick={resetAll} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      <DataTable columns={columns} data={(data?.listPetShops as PetShopRow[] | undefined) ?? []} rowKey={(ps) => ps.id} loading={isLoading} error={error ? String(error) : undefined} rowStyle={(ps) => ({ opacity: ps.ativo ? 1 : 0.5 })} emptyText="Nenhum pet shop cadastrado. Clique em + Novo Pet Shop para começar." />
    </>
  )
}
