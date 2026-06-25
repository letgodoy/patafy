import { initClient, setAuthToken, setActivePetshopId } from '@patafy/graphql-client'

initClient(import.meta.env['VITE_API_URL'] ?? 'http://localhost:3000/graphql')

export { setAuthToken, setActivePetshopId }
