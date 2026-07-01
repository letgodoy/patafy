import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { SkeletonList } from '@patafy/ui'

const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })))
const CadastroPage = lazy(() => import('./pages/CadastroPage.js').then((m) => ({ default: m.CadastroPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })))
const LojasPage = lazy(() => import('./pages/LojasPage.js').then((m) => ({ default: m.LojasPage })))
const LojaPage = lazy(() => import('./pages/LojaPage.js').then((m) => ({ default: m.LojaPage })))
const PetsPage = lazy(() => import('./pages/PetsPage.js').then((m) => ({ default: m.PetsPage })))
const PetFormPage = lazy(() => import('./pages/PetFormPage.js').then((m) => ({ default: m.PetFormPage })))
const PetDetailPage = lazy(() => import('./pages/PetDetailPage.js').then((m) => ({ default: m.PetDetailPage })))
const PetPacotesPage = lazy(() => import('./pages/PetPacotesPage.js').then((m) => ({ default: m.PetPacotesPage })))
const AceitarConvitePage = lazy(() => import('./pages/AceitarConvitePage.js').then((m) => ({ default: m.AceitarConvitePage })))
const LojaServicosPage = lazy(() => import('./pages/servicos/LojaServicosPage.js').then((m) => ({ default: m.LojaServicosPage })))
const AgendarPage = lazy(() => import('./pages/agendamentos/AgendarPage.js').then((m) => ({ default: m.AgendarPage })))
const AgendamentosPage = lazy(() => import('./pages/agendamentos/AgendamentosPage.js').then((m) => ({ default: m.AgendamentosPage })))

function PageFallback() {
  return <div style={{ padding: 24 }}><SkeletonList rows={3} /></div>
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/cadastro" element={<CadastroPage />} />
          <Route path="/convites/aceitar" element={<ProtectedRoute><AceitarConvitePage /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/lojas" element={<ProtectedRoute><LojasPage /></ProtectedRoute>} />
          <Route path="/loja/:slug" element={<ProtectedRoute><LojaPage /></ProtectedRoute>} />
          <Route path="/pets" element={<ProtectedRoute><PetsPage /></ProtectedRoute>} />
          <Route path="/pets/novo" element={<ProtectedRoute><PetFormPage /></ProtectedRoute>} />
          <Route path="/pets/:id/editar" element={<ProtectedRoute><PetFormPage /></ProtectedRoute>} />
          <Route path="/pets/:id" element={<ProtectedRoute><PetDetailPage /></ProtectedRoute>} />
          <Route path="/pets/:id/pacotes" element={<ProtectedRoute><PetPacotesPage /></ProtectedRoute>} />
          <Route path="/loja/:slug/servicos" element={<ProtectedRoute><LojaServicosPage /></ProtectedRoute>} />
          <Route path="/loja/:slug/agendar" element={<ProtectedRoute><AgendarPage /></ProtectedRoute>} />
          <Route path="/agendamentos" element={<ProtectedRoute><AgendamentosPage /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
