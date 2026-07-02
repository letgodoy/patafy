import { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import { useAuth } from '../contexts/AuthContext.js'
import { colors, radius, spacing } from '@patafy/ui'

export function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await signIn(email, senha)
      navigate('/dashboard')
    } catch {
      setErro('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setErro('')
    try {
      await signInWithGoogle()
      navigate('/dashboard')
    } catch {
      setErro('Não foi possível entrar com Google.')
    }
  }

  return (
    <div style={pageStyle}>
      {/* Painel esquerdo — marca */}
      <div style={brandPanelStyle}>
        <div style={brandInnerStyle}>
          <div style={logoStyle}>
            <span style={{ color: colors.teal }}>◆</span>
            <span>Patafy</span>
          </div>
          <h2 style={brandHeadlineStyle}>Cuidado de qualidade para o seu pet.</h2>
          <p style={brandBodyStyle}>Encontre pet shops de confiança, agende banho e tosa, e acompanhe tudo pelo celular.</p>
          <div style={petIconsStyle}>
            <span>🐕</span>
            <span>🐈</span>
            <span>🐇</span>
          </div>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div style={formPanelStyle}>
        <div style={formInnerStyle}>
          <h1 style={formTitleStyle}>Olá, tutor!</h1>
          <p style={formSubtitleStyle}>Entre para acessar seus pets e agendamentos</p>

          <form onSubmit={handleSubmit} style={{ marginTop: spacing.xl }}>
            <div style={{ marginBottom: spacing.md }}>
              <label htmlFor="email" style={labelStyle}>E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seuemail@exemplo.com"
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: spacing.lg }}>
              <label htmlFor="senha" style={labelStyle}>Senha</label>
              <input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>

            {erro && (
              <div style={erroStyle} role="alert">{erro}</div>
            )}

            <button type="submit" disabled={loading} style={btnPrimaryStyle}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div style={dividerStyle}>
            <span style={dividerLineStyle} />
            <span style={{ color: colors.textMuted, fontSize: 13, padding: '0 12px', whiteSpace: 'nowrap' }}>ou continue com</span>
            <span style={dividerLineStyle} />
          </div>

          <button onClick={handleGoogle} style={btnGoogleStyle}>
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Entrar com Google
          </button>

          <p style={{ textAlign: 'center', marginTop: spacing.lg, fontSize: 14, color: colors.textMuted }}>
            Não tem conta?{' '}
            <Link to="/cadastro" style={{ color: colors.teal, fontWeight: 500, textDecoration: 'none' }}>
              Cadastre-se grátis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const pageStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: colors.white,
} as const

const brandPanelStyle = {
  width: '42%',
  background: colors.ink,
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing.xxl}px ${spacing.xl}px`,
  flexShrink: 0,
} as const

const brandInnerStyle = {
  maxWidth: 360,
} as const

const logoStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontWeight: 700,
  fontSize: 22,
  color: '#fff',
  marginBottom: spacing.xxl,
} as const

const brandHeadlineStyle = {
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontSize: 26,
  fontWeight: 700,
  color: '#fff',
  lineHeight: 1.25,
  letterSpacing: '-0.02em',
  margin: `0 0 ${spacing.md}px`,
} as const

const brandBodyStyle = {
  fontSize: 15,
  color: 'rgba(255,255,255,0.6)',
  lineHeight: 1.6,
  margin: `0 0 ${spacing.xl}px`,
} as const

const petIconsStyle = {
  display: 'flex',
  gap: spacing.md,
  fontSize: 36,
} as const

const formPanelStyle = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: `${spacing.xxl}px ${spacing.xl}px`,
} as const

const formInnerStyle = {
  width: '100%',
  maxWidth: 380,
} as const

const formTitleStyle = {
  fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontSize: 26,
  fontWeight: 700,
  color: colors.textPrimary,
  letterSpacing: '-0.02em',
  marginBottom: 4,
} as const

const formSubtitleStyle = {
  fontSize: 15,
  color: colors.textMuted,
  margin: 0,
} as const

const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  marginBottom: 6,
  color: colors.textSecondary,
} as const

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  border: `1.5px solid ${colors.border}`,
  borderRadius: radius.sm,
  fontSize: 14,
  color: colors.textPrimary,
  background: colors.white,
  outline: 'none',
} as const

const erroStyle = {
  background: colors.dangerBg,
  border: `1px solid #FECACA`,
  color: colors.danger,
  padding: '10px 14px',
  borderRadius: radius.sm,
  fontSize: 14,
  marginBottom: spacing.md,
} as const

const btnPrimaryStyle = {
  display: 'block',
  width: '100%',
  padding: '11px 0',
  background: colors.teal,
  color: colors.ink,
  border: 'none',
  borderRadius: radius.sm,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  letterSpacing: '-0.01em',
} as const

const dividerStyle = {
  display: 'flex',
  alignItems: 'center',
  margin: `${spacing.lg}px 0`,
} as const

const dividerLineStyle = {
  flex: 1,
  height: 1,
  background: colors.border,
} as const

const btnGoogleStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  padding: '10px 0',
  background: colors.white,
  color: colors.textPrimary,
  border: `1.5px solid ${colors.border}`,
  borderRadius: radius.sm,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
} as const
