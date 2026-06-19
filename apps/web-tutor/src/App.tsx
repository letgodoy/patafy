import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { LoginPage } from './pages/LoginPage.js'
import { CadastroPage } from './pages/CadastroPage.js'
import { DashboardPage } from './pages/DashboardPage.js'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
      </Routes>
    </AuthProvider>
  )
}
