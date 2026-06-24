import { request } from 'graphql-request'

const state = {
  apiUrl: 'http://localhost:3000/graphql',
  authToken: null as string | null,
  petshopId: null as string | null,
}

export function initClient(apiUrl: string) {
  state.apiUrl = apiUrl
}

export function setAuthToken(token: string | null) {
  state.authToken = token
}

export function setActivePetshopId(id: string | null) {
  state.petshopId = id
}

export function fetcher<TData, TVariables>(
  document: string,
  variables?: TVariables,
): () => Promise<TData> {
  return async () => {
    const headers: Record<string, string> = {}
    if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`
    if (state.petshopId) headers['x-petshop-id'] = state.petshopId
    return request<TData>(state.apiUrl, document, variables ?? undefined, headers)
  }
}
