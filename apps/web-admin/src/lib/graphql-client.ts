import { createClient, cacheExchange, fetchExchange } from '@urql/core'

let authToken: string | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

export const graphqlClient = createClient({
  url: import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000/graphql',
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: (): RequestInit => ({
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  }),
})
