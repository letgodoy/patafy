import { Routes, Route } from 'react-router'

function HomePage() {
  return <h1>Patafy — Administração do Sistema</h1>
}

function NotFoundPage() {
  return <h1>404 — Página não encontrada</h1>
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
