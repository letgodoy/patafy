import { StrictMode, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { AppToaster, toaster } from '@patafy/ui'
import '@patafy/ui/global.css'
import App from './App.tsx'

function AppWithToast() {
  const queryClient = useMemo(() => new QueryClient({
    queryCache: new QueryCache({
      onError: (err) => toaster.create({ title: 'Erro ao carregar', description: err instanceof Error ? err.message : 'Tente novamente', type: 'error' }),
    }),
    mutationCache: new MutationCache({
      onError: (err) => toaster.create({ title: 'Erro ao salvar', description: err instanceof Error ? err.message : 'Tente novamente', type: 'error' }),
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
      <AppToaster />
    </QueryClientProvider>
  )
}

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <AppWithToast />
  </StrictMode>,
)
