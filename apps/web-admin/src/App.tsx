import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { AppLayout } from './components/AppLayout.js'
import { LoginPage } from './pages/LoginPage.js'
import { AcessoNegadoPage } from './pages/AcessoNegadoPage.js'
import { DashboardPage } from './pages/DashboardPage.js'
import { TiposPage } from './pages/catalogo/TiposPage.js'
import { RacasPage } from './pages/catalogo/RacasPage.js'
import { PortesPage } from './pages/catalogo/PortesPage.js'
import { PelagensPage } from './pages/catalogo/PelagensPage.js'
import { AdminsPage } from './pages/AdminsPage.js'
import { PetShopsPage } from './pages/petshops/PetShopsPage.js'

export default function App() {
  return (
    <AuthProvider>
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
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
      </Routes>
    </AuthProvider>
  )
}
