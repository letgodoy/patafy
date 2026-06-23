import { createGqlClient } from '@patafy/graphql-client'

const { client, setAuthToken } = createGqlClient(
  import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000/graphql',
)

export { setAuthToken }
export const gqlClient = client
