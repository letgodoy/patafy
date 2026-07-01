import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { AppLayout } from './components/AppLayout.js'
import { SkeletonList } from '@patafy/ui'

const LoginPage = lazy(() => import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage })))
const AcessoNegadoPage = lazy(() => import('./pages/AcessoNegadoPage.js').then((m) => ({ default: m.AcessoNegadoPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })))
const TiposPage = lazy(() => import('./pages/catalogo/TiposPage.js').then((m) => ({ default: m.TiposPage })))
const RacasPage = lazy(() => import('./pages/catalogo/RacasPage.js').then((m) => ({ default: m.RacasPage })))
const PortesPage = lazy(() => import('./pages/catalogo/PortesPage.js').then((m) => ({ default: m.PortesPage })))
const PelagensPage = lazy(() => import('./pages/catalogo/PelagensPage.js').then((m) => ({ default: m.PelagensPage })))
const AdminsPage = lazy(() => import('./pages/AdminsPage.js').then((m) => ({ default: m.AdminsPage })))
const PetShopsPage = lazy(() => import('./pages/petshops/PetShopsPage.js').then((m) => ({ default: m.PetShopsPage })))
const AuditoriaPage = lazy(() => import('./pages/AuditoriaPage.js').then((m) => ({ default: m.AuditoriaPage })))

function PageFallback() {
  return <div style={{ padding: 24 }}><SkeletonList rows={3} /></div>
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/acesso-negado" element={<AcessoNegadoPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/petshops" element={<PetShopsPage />} />
            <Route path="/catalogo/tipos" element={<TiposPage />} />
            <Route path="/catalogo/racas" element={<RacasPage />} />
            <Route path="/catalogo/portes" element={<PortesPage />} />
            <Route path="/catalogo/pelagens" element={<PelagensPage />} />
            <Route path="/admins" element={<AdminsPage />} />
            <Route path="/auditoria" element={<AuditoriaPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
