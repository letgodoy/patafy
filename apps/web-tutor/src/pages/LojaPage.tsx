import { useParams } from 'react-router'
import { usePetShopBySlugQuery } from '@patafy/graphql-client'
import { colors } from '@patafy/ui'

export function LojaPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data, isLoading, error } = usePetShopBySlugQuery({ slug: slug ?? '' }, { enabled: !!slug })

  if (isLoading) return <div style={{ padding: 24 }}>Carregando...</div>
  if (error) return <div style={{ padding: 24, color: 'red' }}>{String(error)}</div>

  const loja = data?.petShopBySlug
  if (!loja) return <div style={{ padding: 24 }}><h2>Loja não encontrada</h2><p>O endereço <strong>{slug}</strong> não existe ou foi desativado.</p></div>

  const corPrimaria = loja.configJson?.corPrincipal ?? colors.primary
  const nomeExibicao = loja.configJson?.nome ?? loja.nomeExibicao

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ background: corPrimaria, padding: '32px 24px', color: '#fff' }}>
        {loja.configJson?.logo && <img src={loja.configJson.logo} alt={nomeExibicao} style={{ height: 60, marginBottom: 12, objectFit: 'contain' }} />}
        <h1 style={{ margin: '0 0 4px', fontSize: 28 }}>{nomeExibicao}</h1>
        <p style={{ margin: 0, opacity: 0.85 }}>{loja.cidade} — {loja.estado}</p>
      </div>
      <div style={{ padding: 24 }}>
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Contato</h2>
          <p style={{ margin: '0 0 4px' }}><strong>E-mail:</strong> {loja.email}</p>
          {loja.telefone && <p style={{ margin: '0 0 4px' }}><strong>Telefone:</strong> {loja.telefone}</p>}
        </section>
        {loja.configJson?.animaisAtendidos && loja.configJson.animaisAtendidos.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Animais Atendidos</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {loja.configJson.animaisAtendidos.map((a) => <span key={a} style={{ background: '#f0f0f0', padding: '4px 12px', borderRadius: 20, fontSize: 14 }}>{a}</span>)}
            </div>
          </section>
        )}
        {loja.configJson?.tamanhosAceitos && loja.configJson.tamanhosAceitos.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Portes Aceitos</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {loja.configJson.tamanhosAceitos.map((t) => <span key={t} style={{ background: '#f0f0f0', padding: '4px 12px', borderRadius: 20, fontSize: 14 }}>{t}</span>)}
            </div>
          </section>
        )}
        {loja.configJson?.politicaCancelamento && (
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>Política de Cancelamento</h2>
            <p style={{ color: '#555', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{loja.configJson.politicaCancelamento}</p>
          </section>
        )}
        <div style={{ padding: 16, background: '#f8f9fa', borderRadius: 8, textAlign: 'center', color: '#666' }}>
          <p style={{ margin: 0, fontSize: 14 }}>Agendamento online disponível em breve.</p>
        </div>
      </div>
    </div>
  )
}
