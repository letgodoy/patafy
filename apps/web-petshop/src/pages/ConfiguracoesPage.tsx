import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { gqlClient } from '../lib/graphql-client.js'
import { PageHeader, FormCard, btnPrimary, inputStyle, labelStyle } from '@patafy/ui'

const MY_PETSHOP = /* GraphQL */ `
  query MyPetShop {
    myPetShop {
      id nomeExibicao razaoSocial cnpj endereco cidade estado telefone email
      configJson {
        slug nome logo corPrincipal aceitaPetsAgressivos
        intervaloBanhoMinutos prazoCancelamentoHoras prazoRemarcacaoHoras
        politicaCancelamento toleranciaAtrasoMinutos cancelamentoAutomaticoAposAtraso
      }
    }
  }
`

const UPDATE_CONFIG = /* GraphQL */ `
  mutation UpdatePetShopConfig($id: ID!, $config: UpdatePetShopConfigInput!) {
    updatePetShopConfig(id: $id, config: $config) {
      id configJson { slug nome logo corPrincipal }
    }
  }
`

const UPDATE_PETSHOP = /* GraphQL */ `
  mutation UpdatePetShop($id: ID!, $input: UpdatePetShopInput!) {
    updatePetShop(id: $id, input: $input) {
      id nomeExibicao razaoSocial endereco cidade estado telefone email
    }
  }
`

type PetShopConfig = {
  slug?: string | null
  nome?: string | null
  logo?: string | null
  corPrincipal?: string | null
  aceitaPetsAgressivos?: boolean | null
  intervaloBanhoMinutos?: number | null
  prazoCancelamentoHoras?: number | null
  prazoRemarcacaoHoras?: number | null
  politicaCancelamento?: string | null
  toleranciaAtrasoMinutos?: number | null
  cancelamentoAutomaticoAposAtraso?: boolean | null
}

type PetShop = {
  id: string
  nomeExibicao: string
  razaoSocial: string
  cnpj: string
  endereco: string
  cidade: string
  estado: string
  telefone: string | null
  email: string
  configJson: PetShopConfig
}

export function ConfiguracoesPage() {
  const qc = useQueryClient()
  const { data, isLoading, error } = useQuery({
    queryKey: ['myPetshop'],
    queryFn: () => gqlClient.request<{ myPetShop: PetShop | null }>(MY_PETSHOP),
  })
  const updateConfigMutation = useMutation({
    mutationFn: (vars: { id: string; config: Record<string, unknown> }) => gqlClient.request(UPDATE_CONFIG, vars),
  })
  const updatePetShopMutation = useMutation({
    mutationFn: (vars: { id: string; input: Record<string, unknown> }) => gqlClient.request(UPDATE_PETSHOP, vars),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myPetshop'] }),
  })

  const ps = data?.myPetShop

  const [slug, setSlug] = useState('')
  const [nomeExibicao, setNomeExibicao] = useState('')
  const [politica, setPolitica] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [prazoCancelamento, setPrazoCancelamento] = useState('')
  const [prazoRemarcacao, setPrazoRemarcacao] = useState('')
  const [toleranciaAtraso, setToleranciaAtraso] = useState('')
  const [intervaloBanho, setIntervaloBanho] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    if (ps) {
      setSlug(ps.configJson?.slug ?? '')
      setNomeExibicao(ps.nomeExibicao)
      setPolitica(ps.configJson?.politicaCancelamento ?? '')
      setTelefone(ps.telefone ?? '')
      setEmail(ps.email)
      setPrazoCancelamento(ps.configJson?.prazoCancelamentoHoras?.toString() ?? '')
      setPrazoRemarcacao(ps.configJson?.prazoRemarcacaoHoras?.toString() ?? '')
      setToleranciaAtraso(ps.configJson?.toleranciaAtrasoMinutos?.toString() ?? '')
      setIntervaloBanho(ps.configJson?.intervaloBanhoMinutos?.toString() ?? '')
    }
  }, [ps?.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(''); setSucesso('')
    if (!ps) return

    try {
      await updateConfigMutation.mutateAsync({
        id: ps.id,
        config: {
          slug: slug.trim() || undefined,
          politicaCancelamento: politica.trim() || undefined,
          prazoCancelamentoHoras: prazoCancelamento ? Number(prazoCancelamento) : undefined,
          prazoRemarcacaoHoras: prazoRemarcacao ? Number(prazoRemarcacao) : undefined,
          toleranciaAtrasoMinutos: toleranciaAtraso ? Number(toleranciaAtraso) : undefined,
          intervaloBanhoMinutos: intervaloBanho ? Number(intervaloBanho) : undefined,
        },
      })
      await updatePetShopMutation.mutateAsync({
        id: ps.id,
        input: { nomeExibicao: nomeExibicao.trim(), telefone: telefone.trim() || undefined, email: email.trim() },
      })
      setSucesso('Configurações salvas com sucesso!')
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao salvar')
    }
  }

  if (isLoading) return <p>Carregando...</p>
  if (error) return <p style={{ color: 'red' }}>{String(error)}</p>
  if (!ps) return <p style={{ color: '#999' }}>Nenhum pet shop associado a esta conta.</p>

  return (
    <>
      <PageHeader title="Configurações" />

      {sucesso && <p style={{ color: 'green', background: '#f0fff0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>{sucesso}</p>}
      {erro && <p style={{ color: 'red', marginBottom: 16 }}>{erro}</p>}

      <form onSubmit={handleSave}>
        <FormCard title="Dados da Loja">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Nome de exibição *</label><input value={nomeExibicao} onChange={(e) => setNomeExibicao(e.target.value)} required style={inputStyle} /></div>
            <div>
              <label style={labelStyle}>Slug da URL pública</label>
              <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder="meu-pet-shop" style={inputStyle} />
              <small style={{ color: '#999', fontSize: 12 }}>ex: patafy.com/loja/{slug || 'meu-pet-shop'}</small>
            </div>
            <div><label style={labelStyle}>Telefone</label><input value={telefone} onChange={(e) => setTelefone(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>E-mail *</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} /></div>
          </div>
        </FormCard>

        <FormCard title="Políticas e Prazos">
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Prazo cancelamento (horas)</label><input type="number" value={prazoCancelamento} onChange={(e) => setPrazoCancelamento(e.target.value)} min="0" style={{ ...inputStyle, width: 120 }} /></div>
            <div><label style={labelStyle}>Prazo remarcação (horas)</label><input type="number" value={prazoRemarcacao} onChange={(e) => setPrazoRemarcacao(e.target.value)} min="0" style={{ ...inputStyle, width: 120 }} /></div>
            <div><label style={labelStyle}>Tolerância atraso (min)</label><input type="number" value={toleranciaAtraso} onChange={(e) => setToleranciaAtraso(e.target.value)} min="0" style={{ ...inputStyle, width: 120 }} /></div>
            <div><label style={labelStyle}>Intervalo entre banhos (min)</label><input type="number" value={intervaloBanho} onChange={(e) => setIntervaloBanho(e.target.value)} min="0" style={{ ...inputStyle, width: 120 }} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>Política de cancelamento (texto para tutores)</label>
            <textarea value={politica} onChange={(e) => setPolitica(e.target.value)} rows={4} style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </FormCard>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" style={btnPrimary}>Salvar Configurações</button>
        </div>
      </form>
    </>
  )
}
