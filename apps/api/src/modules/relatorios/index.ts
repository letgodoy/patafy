export { relatoriosTypeDefs } from './typedefs.js'
import { relatoriosQueries } from './resolvers.js'

export const relatoriosResolvers = {
  Query: relatoriosQueries,
}
