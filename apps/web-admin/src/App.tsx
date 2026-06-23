import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { LoginPage } from './pages/LoginPage.js'
import { AcessoNegadoPage } from './pages/AcessoNegadoPage.js'
import { DashboardPage } from './pages/DashboardPage.js'
import { TiposPage } from './pages/catalogo/TiposPage.js'
import { RacasPage } from './pages/catalogo/RacasPage.js'
import { PortesPage } from './pages/catalogo/PortesPage.js'
import { PelagensPage } from './pages/catalogo/PelagensPage.js'
import { AdminsPage } from './pages/AdminsPage.js'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/acesso-negado" element={<AcessoNegadoPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/catalogo/tipos" element={<ProtectedRoute><TiposPage /></ProtectedRoute>} />
        <Route path="/catalogo/racas" element={<ProtectedRoute><RacasPage /></ProtectedRoute>} />
        <Route path="/catalogo/portes" element={<ProtectedRoute><PortesPage /></ProtectedRoute>} />
        <Route path="/catalogo/pelagens" element={<ProtectedRoute><PelagensPage /></ProtectedRoute>} />
        <Route path="/admins" element={<ProtectedRoute><AdminsPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
      </Routes>
    </AuthProvider>
  )
}
