import fp from 'fastify-plugin'
import admin from 'firebase-admin'

if (!admin.apps.length) {
  const key = process.env['FIREBASE_SERVICE_ACCOUNT_KEY']
  if (key) {
    admin.initializeApp({ credential: admin.credential.cert(JSON.parse(key)) })
  } else {
    admin.initializeApp({ projectId: process.env['FIREBASE_PROJECT_ID'] })
  }
}

export { admin }

declare module 'fastify' {
  interface FastifyRequest {
    firebaseUser: admin.auth.DecodedIdToken | null
  }
}

export const firebaseAuthPlugin = fp(async (fastify) => {
  fastify.decorateRequest('firebaseUser', null)

  fastify.addHook('onRequest', async (request) => {
    const header = request.headers.authorization
    if (!header?.startsWith('Bearer ')) return
    try {
      request.firebaseUser = await admin.auth().verifyIdToken(header.slice(7))
    } catch {
      // token inválido — resolvers verificam ctx.user
    }
  })
})
