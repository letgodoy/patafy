import { GraphQLClient } from 'graphql-request'

type ClientState = {
  authToken: string | null
  petshopId: string | null
}

export function createGqlClient(apiUrl: string) {
  const state: ClientState = { authToken: null, petshopId: null }

  const client = new GraphQLClient(apiUrl, {
    headers: () => {
      const headers: Record<string, string> = {}
      if (state.authToken) headers['Authorization'] = `Bearer ${state.authToken}`
      if (state.petshopId) headers['x-petshop-id'] = state.petshopId
      return headers
    },
  })

  return {
    client,
    setAuthToken: (token: string | null) => { state.authToken = token },
    setActivePetshopId: (id: string | null) => { state.petshopId = id },
  }
}
