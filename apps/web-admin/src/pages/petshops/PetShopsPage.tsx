import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../../lib/graphql-client.js'
import { DataTable, PageHeader, FormCard, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle } from '@patafy/ui'
import type { Column } from '@patafy/ui'

const LIST_PETSHOPS = /* GraphQL */ `
  query ListPetShops($filter: ListPetShopsFilter) {
    listPetShops(filter: $filter) {
      id nomeExibicao cnpj cidade estado email ativo
      configJson { slug }
      createdAt
    }
  }
`

const CREATE_PETSHOP = /* GraphQL */ `
  mutation CreatePetShop($input: CreatePetShopInput!) {
    createPetShop(input: $input) {
      id nomeExibicao cnpj cidade estado email ativo configJson { slug } createdAt
    }
  }
`

const CREATE_OWNER = /* GraphQL */ `
  mutation CreatePetShopOwner($input: CreatePetShopOwnerInput!) {
    createPetShopOwner(input: $input) { id nome email roles }
  }
`

const DEACTIVATE = /* GraphQL */ `
  mutation DeactivatePetShop($id: ID!) { deactivatePetShop(id: $id) }
`

type PetShop = {
  id: string
  nomeExibicao: string
  cnpj: string
  cidade: string
  estado: string
  email: string
  ativo: boolean
  configJson: { slug?: string | null }
  createdAt: string
}

type Step = 'petshop' | 'owner' | null

export function PetShopsPage() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['petshops'] })

  const { data, isLoading, error } = useQuery({
    queryKey: ['petshops'],
    queryFn: () => gqlClient.request<{ listPetShops: PetShop[] }>(LIST_PETSHOPS, { filter: {} }),
  })
  const createPetShopMutation = useMutation({
    mutationFn: (vars: { input: Record<string, unknown> }) => gqlClient.request<{ createPetShop: PetShop }>(CREATE_PETSHOP, vars),
  })
  const createOwnerMutation = useMutation({
    mutationFn: (vars: { input: Record<string, unknown> }) => gqlClient.request(CREATE_OWNER, vars),
    onSuccess: invalidate,
  })
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => gqlClient.request(DEACTIVATE, { id }),
    onSuccess: invalidate,
  })

  const [step, setStep] = useState<Step>(null)
  const [newPetShopId, setNewPetShopId] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [psNome, setPsNome] = useState('')
  const [psRazao, setPsRazao] = useState('')
  const [psCnpj, setPsCnpj] = useState('')
  const [psEndereco, setPsEndereco] = useState('')
  const [psCidade, setPsCidade] = useState('')
  const [psEstado, setPsEstado] = useState('')
  const [psTel, setPsTel] = useState('')
  const [psEmail, setPsEmail] = useState('')

  const [ownerNome, setOwnerNome] = useState('')
  const [ownerCpf, setOwnerCpf] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerTel, setOwnerTel] = useState('')
  const [ownerSenha, setOwnerSenha] = useState('')

  const resetAll = () => {
    setStep(null); setNewPetShopId(''); setErro('')
    setPsNome(''); setPsRazao(''); setPsCnpj(''); setPsEndereco(''); setPsCidade(''); setPsEstado(''); setPsTel(''); setPsEmail('')
    setOwnerNome(''); setOwnerCpf(''); setOwnerEmail(''); setOwnerTel(''); setOwnerSenha('')
  }

  const handleCreatePetShop = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    try {
      const result = await createPetShopMutation.mutateAsync({
        input: {
          nomeExibicao: psNome.trim(), razaoSocial: psRazao.trim(), cnpj: psCnpj.trim(),
          endereco: psEndereco.trim(), cidade: psCidade.trim(), estado: psEstado.trim().toUpperCase(),
          telefone: psTel.trim() || undefined, email: psEmail.trim(),
        },
      })
      setNewPetShopId(result.createPetShop.id)
      setStep('owner')
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar pet shop')
    }
  }

  const handleCreateOwner = async (e: React.FormEvent) => {
    e.preventDefault(); setErro('')
    try {
      await createOwnerMutation.mutateAsync({
        input: {
          petshopId: newPetShopId, nome: ownerNome.trim(), cpf: ownerCpf.trim(),
          email: ownerEmail.trim(), telefone: ownerTel.trim() || undefined, senha: ownerSenha,
        },
      })
      setSucesso(`Pet shop criado com sucesso! Owner: ${ownerEmail}`)
      resetAll()
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao criar owner')
    }
  }

  const handleDeactivate = async (ps: PetShop) => {
    if (!confirm(`Desativar "${ps.nomeExibicao}"?`)) return
    await deactivateMutation.mutateAsync(ps.id)
  }

  const columns: Column<PetShop>[] = [
    { key: 'nome', header: 'Nome', render: (ps) => ps.nomeExibicao },
    { key: 'cidade', header: 'Cidade / Estado', render: (ps) => `${ps.cidade} / ${ps.estado}` },
    { key: 'slug', header: 'Slug', render: (ps) => ps.configJson?.slug ?? '—' },
    { key: 'email', header: 'E-mail', render: (ps) => ps.email },
    { key: 'status', header: 'Status', width: 90, render: (ps) => <span style={{ color: ps.ativo ? 'green' : '#999' }}>{ps.ativo ? 'Ativo' : 'Inativo'}</span> },
    {
      key: 'acoes', header: 'Ações', width: 120,
      render: (ps) => ps.ativo ? (
        <button onClick={() => handleDeactivate(ps)} style={{ ...btnSmall, color: '#c00' }}>Desativar</button>
      ) : null,
    },
  ]

  return (
    <>
      <PageHeader
        title="Pet Shops"
        action={step === null ? <button onClick={() => setStep('petshop')} style={btnPrimary}>+ Novo Pet Shop</button> : undefined}
      />

      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>{sucesso}</p>}

      {step === 'petshop' && (
        <FormCard title="Novo Pet Shop (1/2)" onSubmit={handleCreatePetShop}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome de exibição *</label><input value={psNome} onChange={(e) => setPsNome(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>Razão social *</label><input value={psRazao} onChange={(e) => setPsRazao(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>CNPJ *</label><input value={psCnpj} onChange={(e) => setPsCnpj(e.target.value)} required placeholder="00.000.000/0000-00" style={inputStyle} /></div>
            <div><label style={labelStyle}>Endereço *</label><input value={psEndereco} onChange={(e) => setPsEndereco(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>Cidade *</label><input value={psCidade} onChange={(e) => setPsCidade(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>Estado (UF) *</label><input value={psEstado} onChange={(e) => setPsEstado(e.target.value)} required maxLength={2} placeholder="SP" style={{ ...inputStyle, width: 80 }} /></div>
            <div><label style={labelStyle}>Telefone</label><input value={psTel} onChange={(e) => setPsTel(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail *</label><input type="email" value={psEmail} onChange={(e) => setPsEmail(e.target.value)} required style={inputStyle} /></div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Próximo: Criar Owner</button>
            <button type="button" onClick={resetAll} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      {step === 'owner' && (
        <FormCard title="Criar Owner (2/2)" onSubmit={handleCreateOwner}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#555' }}>Pet shop criado. Agora crie o owner responsável pela loja.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome *</label><input value={ownerNome} onChange={(e) => setOwnerNome(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>CPF *</label><input value={ownerCpf} onChange={(e) => setOwnerCpf(e.target.value)} required placeholder="000.000.000-00" style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail *</label><input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} required style={inputStyle} /></div>
            <div><label style={labelStyle}>Telefone</label><input value={ownerTel} onChange={(e) => setOwnerTel(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Senha *</label><input type="password" value={ownerSenha} onChange={(e) => setOwnerSenha(e.target.value)} required minLength={6} style={inputStyle} /></div>
          </div>
          {erro && <p style={{ color: 'red', margin: '8px 0 0' }}>{erro}</p>}
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button type="submit" style={btnPrimary}>Criar Owner e Finalizar</button>
            <button type="button" onClick={resetAll} style={btnSecondary}>Cancelar</button>
          </div>
        </FormCard>
      )}

      <DataTable
        columns={columns}
        data={data?.listPetShops ?? []}
        rowKey={(ps) => ps.id}
        loading={isLoading}
        error={error ? String(error) : undefined}
        rowStyle={(ps) => ({ opacity: ps.ativo ? 1 : 0.5 })}
        emptyText="Nenhum pet shop cadastrado. Clique em + Novo Pet Shop para começar."
      />
    </>
  )
}
