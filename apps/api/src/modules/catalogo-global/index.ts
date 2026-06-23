import { tiposAnimalResolvers } from './resolvers/tipos-animal.js'
import { racasResolvers } from './resolvers/racas.js'
import { portesResolvers } from './resolvers/portes.js'
import { pelagensResolvers } from './resolvers/pelagens.js'
import { adminsResolvers } from './resolvers/admins.js'

export { catalogoGlobalTypeDefs } from './typedefs.js'

export const catalogoGlobalResolvers = {
  Query: {
    ...tiposAnimalResolvers.Query,
    ...racasResolvers.Query,
    ...portesResolvers.Query,
    ...pelagensResolvers.Query,
    ...adminsResolvers.Query,
  },
  Mutation: {
    ...tiposAnimalResolvers.Mutation,
    ...racasResolvers.Mutation,
    ...portesResolvers.Mutation,
    ...pelagensResolvers.Mutation,
    ...adminsResolvers.Mutation,
  },
}
