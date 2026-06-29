import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext.js'
import { ProtectedRoute } from './components/ProtectedRoute.js'
import { LoginPage } from './pages/LoginPage.js'
import { CadastroPage } from './pages/CadastroPage.js'
import { DashboardPage } from './pages/DashboardPage.js'
import { LojasPage } from './pages/LojasPage.js'
import { LojaPage } from './pages/LojaPage.js'
import { PetsPage } from './pages/PetsPage.js'
import { PetFormPage } from './pages/PetFormPage.js'
import { PetDetailPage } from './pages/PetDetailPage.js'
import { AceitarConvitePage } from './pages/AceitarConvitePage.js'
import { LojaServicosPage } from './pages/servicos/LojaServicosPage.js'
import { PetPacotesPage } from './pages/PetPacotesPage.js'
import { AgendarPage } from './pages/agendamentos/AgendarPage.js'
import { AgendamentosPage } from './pages/agendamentos/AgendamentosPage.js'

export default function App() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  )
}
