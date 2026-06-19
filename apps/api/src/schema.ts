import { createSchema } from 'graphql-yoga'

export const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      health: String!
    }
  `,
  resolvers: {
    Query: {
      health: () => 'ok',
    },
  },
})
