import { PrismaClient } from '@patafy/db'
import { Resend } from 'resend'
import { templateAgendado, templateConfirmado, templateCancelado, templateAlterado } from './templates/email.js'

const POLL_INTERVAL_MS = Number(process.env['POLL_INTERVAL_MS'] ?? 5000)
const MAX_TENTATIVAS = 5
const DRY_RUN = process.env['EMAIL_DRY_RUN'] === 'true'
const EMAIL_FROM = process.env['EMAIL_FROM'] ?? 'noreply@patafy.care'
const EMAIL_FROM_NAME = process.env['EMAIL_FROM_NAME'] ?? 'Patafy Care'

const prisma = new PrismaClient()
const resend = new Resend(process.env['RESEND_API_KEY'] ?? '')

type OutboxPayload = {
  agendamento_id: string
  pet_nome: string
  petshop_nome: string
  data_hora_inicio: string
  servicos_resumo: string[]
  endereco_loja: string | null
  link_agendamento: string
}

function buildEmailContent(tipo: string, payload: OutboxPayload) {
  switch (tipo) {
    case 'agendado': return templateAgendado(payload)
    case 'confirmado': return templateConfirmado(payload)
    case 'cancelado': return templateCancelado(payload)
    case 'alterado': return templateAlterado(payload)
    default: throw new Error(`Tipo desconhecido: ${tipo}`)
  }
}

function retryDelay(tentativas: number): number {
  const delays = [60_000, 300_000, 1_800_000, 7_200_000]
  return delays[tentativas] ?? delays[delays.length - 1]!
}

async function processOutbox(): Promise<void> {
  const batch = await prisma.notificacaoOutbox.findMany({
    where: { status: 'pendente', canal: 'email' },
    include: { user: true },
    orderBy: { created_at: 'asc' },
    take: 20,
  })

  for (const item of batch) {
    const payload = item.payload as OutboxPayload

    try {
      const { subject, html, text } = buildEmailContent(item.tipo, payload)

      if (DRY_RUN) {
        console.log(`[worker:dry-run] ${item.tipo} → ${item.user.email} | ${subject}`)
      } else {
        await resend.emails.send({
          from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
          to: item.user.email,
          subject,
          html,
          text,
        })
      }

      await prisma.notificacaoOutbox.update({
        where: { id: item.id },
        data: { status: 'enviado', data_envio: new Date(), erro: null },
      })

      console.log(`[worker] ✓ ${item.tipo} → ${item.user.email}`)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      const novasTentativas = item.tentativas + 1

      if (novasTentativas >= MAX_TENTATIVAS) {
        await prisma.notificacaoOutbox.update({
          where: { id: item.id },
          data: { status: 'falha', tentativas: novasTentativas, erro: errMsg },
        })
        console.error(`[worker] ✗ falha definitiva (${item.tipo} id=${item.id}): ${errMsg}`)
      } else {
        await prisma.notificacaoOutbox.update({
          where: { id: item.id },
          data: { tentativas: novasTentativas, erro: errMsg },
        })
        const nextMs = retryDelay(item.tentativas)
        console.warn(`[worker] ↻ retry ${novasTentativas}/${MAX_TENTATIVAS} em ${nextMs / 1000}s (${item.tipo} id=${item.id})`)
      }
    }
  }
}

async function loop(): Promise<void> {
  console.log(`[worker] iniciando — poll a cada ${POLL_INTERVAL_MS}ms${DRY_RUN ? ' (DRY_RUN)' : ''}`)

  while (true) {
    try {
      await processOutbox()
    } catch (err) {
      console.error('[worker] erro no ciclo:', err)
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
  }
}

loop().catch((err) => {
  console.error('[worker] erro fatal:', err)
  process.exit(1)
})
