import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { AppLayout } from './components/AppLayout.js'
import { LoginPage } from './pages/LoginPage.js'
import { SemAcessoPage } from './pages/SemAcessoPage.js'
import { DashboardPage } from './pages/DashboardPage.js'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage.js'
import { EquipePage } from './pages/EquipePage.js'
import { BloqueiosPage } from './pages/BloqueiosPage.js'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/sem-acesso" element={<SemAcessoPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/configuracoes" element={<ConfiguracoesPage />} />
          <Route path="/equipe" element={<EquipePage />} />
          <Route path="/bloqueios" element={<BloqueiosPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
      </Routes>
    </AuthProvider>
  )
}
