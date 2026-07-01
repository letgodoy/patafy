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
import { BuscarClientePage } from './pages/clientes/BuscarClientePage.js'
import { NovoClientePage } from './pages/clientes/NovoClientePage.js'
import { NovoPetClientePage } from './pages/clientes/NovoPetClientePage.js'
import { CategoriasPage } from './pages/servicos/CategoriasPage.js'
import { ServicosPage } from './pages/servicos/ServicosPage.js'
import { PacotesPage } from './pages/pacotes/PacotesPage.js'
import { VenderPacotePage } from './pages/pacotes/VenderPacotePage.js'
import { AgendaPage } from './pages/agenda/AgendaPage.js'
import { MinhaAgendaPage } from './pages/agenda/MinhaAgendaPage.js'

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
          <Route path="/clientes/buscar" element={<BuscarClientePage />} />
          <Route path="/clientes/novo" element={<NovoClientePage />} />
          <Route path="/clientes/:tutorProfileId/pets/novo" element={<NovoPetClientePage />} />
          <Route path="/categorias" element={<CategoriasPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/pacotes" element={<PacotesPage />} />
          <Route path="/pacotes/vender" element={<VenderPacotePage />} />
          <Route path="/agenda" element={<AgendaPage />} />
          <Route path="/minha-agenda" element={<MinhaAgendaPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<h1>404 — Página não encontrada</h1>} />
      </Routes>
    </AuthProvider>
  )
}
