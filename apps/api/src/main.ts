import Fastify from 'fastify'
import rateLimit from '@fastify/rate-limit'
import { createYoga } from 'graphql-yoga'
import { prisma } from './lib/prisma.js'
import { schema } from './schema.js'
import { buildContext } from './context.js'
import { registerIcsRoute } from './plugins/ics.js'

const PORT = Number(process.env['PORT'] ?? 3000)
const HOST = process.env['HOST'] ?? '0.0.0.0'

const CORS_ORIGINS = [
  process.env['CORS_ORIGIN_TUTOR'] ?? 'http://localhost:5173',
  process.env['CORS_ORIGIN_PETSHOP'] ?? 'http://localhost:5174',
  process.env['CORS_ORIGIN_ADMIN'] ?? 'http://localhost:5175',
].filter(Boolean)

async function bootstrap() {
  const app = Fastify({ logger: true })

  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' })

  // Health checks
  app.get('/health/live', async () => ({ status: 'ok' }))

  app.get('/health/ready', async (_req, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'ok' }
    } catch {
      return reply.status(503).send({ status: 'unavailable' })
    }
  })

  // GraphQL Yoga
  const yoga = createYoga({
    schema,
    graphqlEndpoint: '/graphql',
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    context: ({ request }) => buildContext(request, prisma),
  })

  app.route({
    url: '/graphql',
    method: ['GET', 'POST', 'OPTIONS'],
    handler: async (req, reply) => {
      const response = await yoga.handleNodeRequestAndResponse(req, reply)
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.status(response.status)
      reply.send(response.body)
      return reply
    },
  })

  await registerIcsRoute(app, prisma)

  await app.listen({ port: PORT, host: HOST })
  app.log.info(`API running at http://${HOST}:${PORT}`)
  app.log.info(`GraphQL at http://${HOST}:${PORT}/graphql`)
}

bootstrap().catch((err) => {
  console.error(err)
  process.exit(1)
})
