import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { useAcceptPetTutorConviteMutation, useMyPetsQuery } from '@patafy/graphql-client'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '@patafy/ui'

export function AceitarConvitePage() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [mensagem, setMensagem] = useState('')

  const acceptMutation = useAcceptPetTutorConviteMutation({
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: useMyPetsQuery.getKey() })
      setStatus('success')
      setMensagem('Convite aceito com sucesso! O pet foi adicionado à sua lista.')
    },
  })

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMensagem('Token de convite não encontrado na URL.')
      return
    }
    acceptMutation.mutateAsync({ token }).catch((err: unknown) => {
      setStatus('error')
      setMensagem((err as { response?: { errors?: { message: string }[] } })?.response?.errors?.[0]?.message ?? 'Erro ao aceitar convite.')
    })
  }, [])

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      {status === 'loading' && <p>Processando convite...</p>}
      {status === 'success' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <h2 style={{ margin: '0 0 8px' }}>Convite aceito!</h2>
          <p style={{ color: '#555', marginBottom: 24 }}>{mensagem}</p>
          <button onClick={() => navigate('/pets')} style={{ background: colors.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 15 }}>
            Ver meus pets
          </button>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ margin: '0 0 8px' }}>Convite inválido</h2>
          <p style={{ color: '#555', marginBottom: 24 }}>{mensagem}</p>
          <button onClick={() => navigate('/dashboard')} style={{ background: colors.primary, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 4, cursor: 'pointer', fontSize: 15 }}>
            Ir para o início
          </button>
        </>
      )}
    </div>
  )
}
