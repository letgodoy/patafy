import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { AppLayout } from './components/AppLayout.js'
import { SkeletonList } from '@patafy/ui'

const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })))
const SemAcessoPage = lazy(() => import('./pages/SemAcessoPage.js').then((m) => ({ default: m.SemAcessoPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })))
const ConfiguracoesPage = lazy(() => import('./pages/ConfiguracoesPage.js').then((m) => ({ default: m.ConfiguracoesPage })))
const EquipePage = lazy(() => import('./pages/EquipePage.js').then((m) => ({ default: m.EquipePage })))
const BloqueiosPage = lazy(() => import('./pages/BloqueiosPage.js').then((m) => ({ default: m.BloqueiosPage })))
const BuscarClientePage = lazy(() => import('./pages/clientes/BuscarClientePage.js').then((m) => ({ default: m.BuscarClientePage })))
const NovoClientePage = lazy(() => import('./pages/clientes/NovoClientePage.js').then((m) => ({ default: m.NovoClientePage })))
const NovoPetClientePage = lazy(() => import('./pages/clientes/NovoPetClientePage.js').then((m) => ({ default: m.NovoPetClientePage })))
const CategoriasPage = lazy(() => import('./pages/servicos/CategoriasPage.js').then((m) => ({ default: m.CategoriasPage })))
const ServicosPage = lazy(() => import('./pages/servicos/ServicosPage.js').then((m) => ({ default: m.ServicosPage })))
const PacotesPage = lazy(() => import('./pages/pacotes/PacotesPage.js').then((m) => ({ default: m.PacotesPage })))
const VenderPacotePage = lazy(() => import('./pages/pacotes/VenderPacotePage.js').then((m) => ({ default: m.VenderPacotePage })))
const AgendaPage = lazy(() => import('./pages/agenda/AgendaPage.js').then((m) => ({ default: m.AgendaPage })))
const MinhaAgendaPage = lazy(() => import('./pages/agenda/MinhaAgendaPage.js').then((m) => ({ default: m.MinhaAgendaPage })))
const AuditoriaPetshopPage = lazy(() => import('./pages/auditoria/AuditoriaPetshopPage.js').then((m) => ({ default: m.AuditoriaPetshopPage })))
const RelatoriosPage = lazy(() => import('./pages/relatorios/RelatoriosPage.js').then((m) => ({ default: m.RelatoriosPage })))

function PageFallback() {
  return <div style={{ padding: 24 }}><SkeletonList rows={3} /></div>
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/sem-acesso" element={<SemAcessoPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/equipe" element={<EquipePage />} />
            <Route path="/bloqueios" element={<BloqueiosPage />} />
            <Route path="/clientes/buscar" element={<BuscarClientePage />} />
            <Route path="/clientes/novo" element={<NovoClientePage />} />
            <Route path="/clientes/:tutorProfileId/pets/novo" element={<NovoPetClientePage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/servicos" element={<ServicosPage />} />
            <Route path="/pacotes" element={<PacotesPage />} />
            <Route path="/pacotes/vender" element={<VenderPacotePage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/minha-agenda" element={<MinhaAgendaPage />} />
            <Route path="/auditoria" element={<AuditoriaPetshopPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
