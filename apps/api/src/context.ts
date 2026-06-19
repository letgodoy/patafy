import type { PrismaClient, User, TutorProfile, PetshopUserProfile } from '@patafy/db'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { admin } from './plugins/firebase-auth.js'

export interface GraphQLContext {
  prisma: PrismaClient
  firebaseUser: DecodedIdToken | null
  user: User | null
  tutorProfile: TutorProfile | null
  petshopProfiles: PetshopUserProfile[]
  activePetshopId: string | null
  isSystemAdmin: boolean
}

export async function buildContext(
  request: Request,
  prisma: PrismaClient,
): Promise<GraphQLContext> {
  const authHeader = request.headers.get('authorization')
  let firebaseUser: DecodedIdToken | null = null

  if (authHeader?.startsWith('Bearer ')) {
    try {
      firebaseUser = await admin.auth().verifyIdToken(authHeader.slice(7))
    } catch {
      // token inválido — resolvers verificam ctx.user
    }
  }

  if (!firebaseUser) {
    return { prisma, firebaseUser: null, user: null, tutorProfile: null, petshopProfiles: [], activePetshopId: null, isSystemAdmin: false }
  }

  const userRecord = await prisma.user.findUnique({
    where: { firebase_uid: firebaseUser.uid },
    include: { tutor_profile: true, petshop_profiles: true },
  })

  return {
    prisma,
    firebaseUser,
    user: userRecord,
    tutorProfile: userRecord?.tutor_profile ?? null,
    petshopProfiles: userRecord?.petshop_profiles ?? [],
    activePetshopId: request.headers.get('x-petshop-id'),
    isSystemAdmin: firebaseUser['system_admin'] === true,
  }
}
