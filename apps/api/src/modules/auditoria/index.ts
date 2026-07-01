export { auditoriaTypeDefs } from './typedefs.js'
import { auditoriaQueries } from './resolvers.js'

export const auditoriaResolvers = {
  Query: auditoriaQueries,
}
