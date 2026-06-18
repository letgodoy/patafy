import { Routes, Route } from 'react-router-dom'

function HomePage() {
  return <h1>Patafy — Área do Tutor</h1>
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
