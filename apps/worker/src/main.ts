import { PrismaClient } from '@patafy/db'

const POLL_INTERVAL_MS = Number(process.env['POLL_INTERVAL_MS'] ?? 5000)

const prisma = new PrismaClient()

async function processOutbox(): Promise<void> {
  // placeholder: processar NotificacaoOutbox (implementado no E09)
  const pending = await prisma.notificacaoOutbox.count({
    where: { status: 'pendente' },
  })

  if (pending > 0) {
    console.log(`[worker] ${pending} notificações pendentes (E09 não implementado ainda)`)
  }
}

async function runJobs(): Promise<void> {
  // placeholder: jobs periódicos (cancelamento automático por atraso — E07)
}

async function loop(): Promise<void> {
  console.log(`[worker] iniciando — poll a cada ${POLL_INTERVAL_MS}ms`)

  while (true) {
    try {
      await processOutbox()
      await runJobs()
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
