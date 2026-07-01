import { StrictMode, useState, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { ErrorToast } from '@patafy/ui'
import App from './App.tsx'

function AppWithErrorHandler() {
  const [gqlError, setGqlError] = useState<string | null>(null)

  const queryClient = useMemo(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => setGqlError(err instanceof Error ? err.message : 'Erro ao carregar dados'),
    }),
    mutationCache: new MutationCache({
      onError: (err) => setGqlError(err instanceof Error ? err.message : 'Erro ao salvar'),
    }),
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
    },
  }), [])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {gqlError && <ErrorToast message={gqlError} onClose={() => setGqlError(null)} />}
    </QueryClientProvider>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <AppWithErrorHandler />
  </StrictMode>,
)
