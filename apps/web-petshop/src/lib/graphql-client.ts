import { createGqlClient } from '@patafy/graphql-client'

const { client, setAuthToken, setActivePetshopId } = createGqlClient(
  import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000/graphql',
)

export { setAuthToken, setActivePetshopId }
export const gqlClient = client
