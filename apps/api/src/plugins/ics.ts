import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@patafy/db'
import { admin } from './firebase-auth.js'

/** Gera UID estável para o evento iCal (RFC 5545). */
function icsUid(agendamentoId: string): string {
  return `agendamento-${agendamentoId}@patafy.care`
}

/** Formata Date como valor iCal: YYYYMMDDTHHMMSSZ */
function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0]! + 'Z'
}

/** Escapa texto para VALUE=TEXT em iCal. */
function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

export async function registerIcsRoute(app: FastifyInstance, prisma: PrismaClient) {
  app.get('/calendar/agendamentos/:id.ics', async (req, reply) => {
    const { id } = req.params as { id: string }

    // Auth
    const authHeader = req.headers['authorization']
    let uid: string | null = null
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      try {
        const token = await admin.auth().verifyIdToken(authHeader.slice(7))
        uid = token.uid
      } catch {
        // invalid token — will fail auth check below
      }
    }
    if (!uid) return reply.status(401).send({ error: 'Não autenticado' })

    const user = await prisma.user.findUnique({ where: { firebase_uid: uid }, include: { tutor_profile: true, petshop_profiles: true } })
    if (!user) return reply.status(401).send({ error: 'Usuário não encontrado' })

    const ag = await prisma.agendamento.findUnique({
      where: { id },
      include: {
        petshop: true,
        pet: true,
        tutor_profile: { include: { user: true } },
      },
    })
    if (!ag) return reply.status(404).send({ error: 'Agendamento não encontrado' })

    const isTutorDono = user.tutor_profile?.id === ag.tutor_profile_id
    const isStaff = user.petshop_profiles.some((p) => p.petshop_id === ag.petshop_id && p.ativo)
    if (!isTutorDono && !isStaff) return reply.status(403).send({ error: 'Sem permissão' })

    const fim = new Date(ag.data_hora_inicio.getTime() + ag.duracao_total_minutos * 60000)
    const loja = ag.petshop
    const cfg = loja.config_json as Record<string, unknown>
    const nomeLoja = String(cfg.nome ?? loja.nome_exibicao)

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Patafy Care//Agendamento//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${icsUid(ag.id)}`,
      `DTSTAMP:${icsDate(new Date())}`,
      `DTSTART:${icsDate(ag.data_hora_inicio)}`,
      `DTEND:${icsDate(fim)}`,
      `SUMMARY:${icsEscape(`Banho — ${ag.pet.nome} @ ${nomeLoja}`)}`,
      `LOCATION:${icsEscape(`${loja.endereco}, ${loja.cidade} - ${loja.estado}`)}`,
      `DESCRIPTION:${icsEscape(`Pet: ${ag.pet.nome}\\nLoja: ${nomeLoja}\\nStatus: ${ag.status}`)}`,
      `STATUS:${ag.status === 'Cancelado' ? 'CANCELLED' : 'CONFIRMED'}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    reply.header('Content-Type', 'text/calendar; charset=utf-8')
    reply.header('Content-Disposition', `attachment; filename="agendamento-${ag.id}.ics"`)
    return reply.send(ics)
  })
}
