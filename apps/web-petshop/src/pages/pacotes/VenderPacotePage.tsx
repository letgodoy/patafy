import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useMyPetShopIdQuery, useListPacotesQuery, useListServicosQuery, useSearchTutorQuery, useVenderPacoteTravadoMutation, useVenderPacotePersonalizadoMutation } from '@patafy/graphql-client'
import { PageHeader, btnPrimary, btnSecondary, btnSmall, inputStyle, labelStyle, colors } from '@patafy/ui'

type Variante = { id: string; porteId: string | null; duracaoMinutos: number; preco: number }
type Servico = { id: string; nome: string; variantes: Variante[] }
type Pacote = { id: string; nome: string; travado: boolean; ativo: boolean; descontoPercentual: number | null; items: { servicoVarianteId: string; quantidadeTotal: number }[] }
type ItemWizard = { servicoVarianteId: string; servicoNome: string; preco: number; quantidade: number }

type Step = 'buscar-tutor' | 'selecionar-pet' | 'tipo-pacote' | 'configurar' | 'confirmar'

export function VenderPacotePage() {
  const navigate = useNavigate()
  const { data: psData } = useMyPetShopIdQuery()
  const petshopId = psData?.myPetShop?.id ?? ''

  const { data: pacotesData } = useListPacotesQuery({ petshopId }, { enabled: !!petshopId })
  const { data: servicosData } = useListServicosQuery({ petshopId }, { enabled: !!petshopId })

  const [step, setStep] = useState<Step>('buscar-tutor')
  const [busca, setBusca] = useState('')
  const [tipoBusca, setTipoBusca] = useState<'cpf' | 'email'>('cpf')
  const [queryAtiva, setQueryAtiva] = useState<{ cpf?: string; email?: string } | null>(null)
  const [petId, setPetId] = useState('')
  const [tipoPacote, setTipoPacote] = useState<'travado' | 'personalizado'>('travado')
  const [pacoteId, setPacoteId] = useState('')
  const [itens, setItens] = useState<ItemWizard[]>([])
  const [desconto, setDesconto] = useState('')
  const [dataAtivacao, setDataAtivacao] = useState(new Date().toISOString().slice(0, 10))
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  const { data: tutorData, isLoading: buscando } = useSearchTutorQuery(
    { cpf: queryAtiva?.cpf, email: queryAtiva?.email },
    { enabled: !!queryAtiva },
  )
  const tutor = tutorData?.searchTutor

  const venderTravadoMutation = useVenderPacoteTravadoMutation()
  const venderPersonalizadoMutation = useVenderPacotePersonalizadoMutation()

  const pacotes = ((pacotesData?.listPacotes as Pacote[] | undefined) ?? []).filter((p) => p.ativo)
  const servicos = (servicosData?.listServicos as Servico[] | undefined) ?? []
  const allVariantes = servicos.flatMap((s) => s.variantes.map((v) => ({ ...v, servicoNome: s.nome })))

  const subtotal = itens.reduce((acc, i) => acc + i.preco * i.quantidade, 0)
  const descontoNum = desconto ? Number(desconto) : 0
  const total = subtotal * (1 - descontoNum / 100)

  const handleBuscar = () => {
    const v = busca.trim()
    setQueryAtiva(tipoBusca === 'cpf' ? { cpf: v } : { email: v })
  }

  const addItem = (varianteId: string) => {
    const v = allVariantes.find((v) => v.id === varianteId)
    if (!v) return
    setItens((prev) => {
      const ex = prev.find((i) => i.servicoVarianteId === varianteId)
      if (ex) return prev.map((i) => i.servicoVarianteId === varianteId ? { ...i, quantidade: i.quantidade + 1 } : i)
      return [...prev, { servicoVarianteId: varianteId, servicoNome: v.servicoNome, preco: v.preco, quantidade: 1 }]
    })
  }

  const handleConfirmar = async () => {
    setErro('')
    try {
      if (tipoPacote === 'travado') {
        if (!pacoteId) { setErro('Selecione um pacote'); return }
        await venderTravadoMutation.mutateAsync({ pacoteId, petId, dataAtivacao })
      } else {
        if (itens.length === 0) { setErro('Adicione pelo menos um item'); return }
        await venderPersonalizadoMutation.mutateAsync({ petshopId, petId, itens: itens.map((i) => ({ servicoVarianteId: i.servicoVarianteId, quantidade: i.quantidade })), descontoPercentual: descontoNum || undefined, dataAtivacao })
      }
      setSucesso(true)
    } catch (err: unknown) {
      setErro((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao vender pacote')
    }
  }

  if (sucesso) return (
    <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h2>Pacote vendido com sucesso!</h2>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <button onClick={() => navigate('/pacotes')} style={btnSecondary}>Ver Pacotes</button>
        <button onClick={() => { setSucesso(false); setStep('buscar-tutor'); setBusca(''); setQueryAtiva(null); setPetId(''); setItens([]) }} style={btnPrimary}>Nova Venda</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 24 }}>
      <PageHeader title="Vender Pacote" />

      {/* Indicador de progresso */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {(['buscar-tutor', 'selecionar-pet', 'tipo-pacote', 'configurar', 'confirmar'] as Step[]).map((s, i) => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: step === s ? colors.primary : ['buscar-tutor', 'selecionar-pet', 'tipo-pacote', 'configurar', 'confirmar'].indexOf(step) > i ? '#86efac' : '#e5e7eb' }} />
        ))}
      </div>

      <div style={{ background: '#fff', border: `1px solid ${colors.border}`, borderRadius: 8, padding: 24 }}>
        {/* Step 1: Buscar tutor */}
        {step === 'buscar-tutor' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>1. Localizar cliente</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={tipoBusca} onChange={(e) => setTipoBusca(e.target.value as 'cpf' | 'email')} style={inputStyle}>
                <option value="cpf">CPF</option>
                <option value="email">E-mail</option>
              </select>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder={tipoBusca === 'cpf' ? '000.000.000-00' : 'email@...'} style={{ ...inputStyle, flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && handleBuscar()} />
              <button onClick={handleBuscar} style={btnPrimary}>Buscar</button>
            </div>
            {buscando && <p style={{ color: '#666', marginTop: 12 }}>Buscando...</p>}
            {queryAtiva && !buscando && !tutor && <p style={{ color: '#c00', marginTop: 12 }}>Cliente não encontrado.</p>}
            {tutor && (
              <div style={{ marginTop: 16, padding: 16, background: '#f0fdf4', borderRadius: 8 }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600 }}>{tutor.nome}</p>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#666' }}>{tutor.email}</p>
                <p style={{ margin: '0 0 16px', fontSize: 13 }}>
                  <label style={labelStyle}>Pet ID (cole ou informe o ID do pet)</label>
                  <input value={petId} onChange={(e) => setPetId(e.target.value)} placeholder="uuid do pet" style={{ ...inputStyle, width: '100%' }} />
                </p>
                <button onClick={() => { if (!petId) { setErro('Informe o ID do pet'); return }; setErro(''); setStep('tipo-pacote') }} style={btnPrimary} disabled={!petId}>Continuar</button>
              </div>
            )}
            {erro && <p style={{ color: '#c00', marginTop: 8 }}>{erro}</p>}
          </>
        )}

        {/* Step 2: Tipo de pacote */}
        {step === 'tipo-pacote' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>2. Tipo de pacote</h3>
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              {(['travado', 'personalizado'] as const).map((t) => (
                <div key={t} onClick={() => setTipoPacote(t)} style={{ flex: 1, padding: 16, borderRadius: 8, border: `2px solid ${tipoPacote === t ? colors.primary : colors.border}`, cursor: 'pointer', textAlign: 'center' }}>
                  <strong>{t === 'travado' ? 'Pacote Fixo' : 'Personalizado'}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{t === 'travado' ? 'Composição pré-definida' : 'Monte na hora'}</p>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep('buscar-tutor')} style={btnSecondary}>Voltar</button>
              <button onClick={() => setStep('configurar')} style={btnPrimary}>Continuar</button>
            </div>
          </>
        )}

        {/* Step 3: Configurar */}
        {step === 'configurar' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>3. {tipoPacote === 'travado' ? 'Selecionar pacote' : 'Montar pacote'}</h3>
            {tipoPacote === 'travado' ? (
              <div>
                {pacotes.filter((p) => p.travado).map((p) => (
                  <div key={p.id} onClick={() => setPacoteId(p.id)} style={{ padding: 12, marginBottom: 8, borderRadius: 8, border: `2px solid ${pacoteId === p.id ? colors.primary : colors.border}`, cursor: 'pointer' }}>
                    <strong>{p.nome}</strong>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{p.items.length} itens{p.descontoPercentual ? ` · ${p.descontoPercentual}% desconto` : ''}</p>
                  </div>
                ))}
                {pacotes.filter((p) => p.travado).length === 0 && <p style={{ color: '#666' }}>Nenhum pacote fixo ativo.</p>}
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <label style={labelStyle}>Adicionar serviço</label>
                  <select onChange={(e) => addItem(e.target.value)} value="" style={inputStyle}>
                    <option value="">Selecione uma variante...</option>
                    {allVariantes.map((v) => <option key={v.id} value={v.id}>{v.servicoNome} — R$ {Number(v.preco).toFixed(2)}</option>)}
                  </select>
                </div>
                {itens.map((item) => (
                  <div key={item.servicoVarianteId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${colors.border}` }}>
                    <span style={{ fontSize: 14 }}>{item.servicoNome}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => setItens((prev) => prev.map((i) => i.servicoVarianteId === item.servicoVarianteId ? { ...i, quantidade: Math.max(1, i.quantidade - 1) } : i))} style={{ ...btnSmall, width: 28 }}>−</button>
                      <span style={{ width: 24, textAlign: 'center' }}>{item.quantidade}</span>
                      <button onClick={() => setItens((prev) => prev.map((i) => i.servicoVarianteId === item.servicoVarianteId ? { ...i, quantidade: i.quantidade + 1 } : i))} style={{ ...btnSmall, width: 28 }}>+</button>
                      <span style={{ fontSize: 13, color: '#555', width: 80, textAlign: 'right' }}>R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                      <button onClick={() => setItens((prev) => prev.filter((i) => i.servicoVarianteId !== item.servicoVarianteId))} style={{ ...btnSmall, color: '#c00', fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                ))}
                {itens.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                    <div>
                      <label style={{ ...labelStyle, fontSize: 12 }}>Desconto (%)</label>
                      <input type="number" min={0} max={100} value={desconto} onChange={(e) => setDesconto(e.target.value)} style={{ ...inputStyle, width: 80 }} />
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {descontoNum > 0 && <p style={{ margin: '0 0 2px', fontSize: 12, color: '#666', textDecoration: 'line-through' }}>R$ {subtotal.toFixed(2)}</p>}
                      <strong style={{ fontSize: 16 }}>R$ {total.toFixed(2)}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={() => setStep('tipo-pacote')} style={btnSecondary}>Voltar</button>
              <button onClick={() => setStep('confirmar')} style={btnPrimary}>Continuar</button>
            </div>
          </>
        )}

        {/* Step 4: Confirmar */}
        {step === 'confirmar' && (
          <>
            <h3 style={{ margin: '0 0 16px' }}>4. Confirmar venda</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Data de ativação</label>
              <input type="date" value={dataAtivacao} onChange={(e) => setDataAtivacao(e.target.value)} style={inputStyle} />
            </div>
            {tipoPacote === 'travado' && (
              <p style={{ fontSize: 14, margin: '0 0 16px' }}>Pacote: <strong>{pacotes.find((p) => p.id === pacoteId)?.nome}</strong></p>
            )}
            {tipoPacote === 'personalizado' && (
              <div style={{ marginBottom: 16 }}>
                {itens.map((i) => <p key={i.servicoVarianteId} style={{ margin: '4px 0', fontSize: 14 }}>{i.servicoNome} × {i.quantidade} — R$ {(i.preco * i.quantidade).toFixed(2)}</p>)}
                <strong>Total: R$ {total.toFixed(2)}</strong>
              </div>
            )}
            {erro && <p style={{ color: '#c00', marginBottom: 12 }}>{erro}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep('configurar')} style={btnSecondary}>Voltar</button>
              <button onClick={handleConfirmar} style={btnPrimary} disabled={venderTravadoMutation.isPending || venderPersonalizadoMutation.isPending}>
                {venderTravadoMutation.isPending || venderPersonalizadoMutation.isPending ? 'Processando...' : 'Confirmar Venda'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
