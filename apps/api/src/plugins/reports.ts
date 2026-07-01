import type { FastifyInstance } from 'fastify'
import type { PrismaClient } from '@patafy/db'
import { admin } from './firebase-auth.js'

async function resolveOwner(req: { headers: { authorization?: string | string[] } }, prisma: PrismaClient, petshopId: string): Promise<boolean> {
  const authHeader = req.headers['authorization']
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return false
  try {
    const token = await admin.auth().verifyIdToken(authHeader.slice(7))
    const user = await prisma.user.findUnique({
      where: { firebase_uid: token.uid },
      select: { petshop_profiles: { where: { petshop_id: petshopId, ativo: true } } },
    })
    return user?.petshop_profiles.some((p) => p.roles.includes('owner')) ?? false
  } catch {
    return false
  }
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0]!)
  const lines = [headers.join(';')]
  for (const row of rows) lines.push(headers.map((h) => String(row[h] ?? '')).join(';'))
  return lines.join('\r\n')
}

const MAX_DAYS_MS = 366 * 24 * 60 * 60 * 1000

function validateRange(reply: { status: (n: number) => { send: (v: unknown) => unknown } }, from: string, to: string): { fromDate: Date; toDate: Date } | null {
  const fromDate = new Date(from)
  const toDate = new Date(to)
  if (toDate.getTime() - fromDate.getTime() > MAX_DAYS_MS) {
    reply.status(400).send({ error: 'Intervalo máximo: 366 dias' })
    return null
  }
  return { fromDate, toDate }
}

export async function registerReportsRoute(app: FastifyInstance, prisma: PrismaClient) {
  app.get('/reports/atendimentos.csv', async (req, reply) => {
    const { petshopId, from, to } = req.query as { petshopId?: string; from?: string; to?: string }
    if (!petshopId || !from || !to) return reply.status(400).send({ error: 'petshopId, from e to são obrigatórios' })
    const range = validateRange(reply, from, to)
    if (!range) return
    const { fromDate, toDate } = range

    if (!(await resolveOwner(req, prisma, petshopId))) return reply.status(403).send({ error: 'Apenas owner' })

    const agendamentos = await prisma.agendamento.findMany({
      where: { petshop_id: petshopId, status: 'Finalizado', data_hora_inicio: { gte: fromDate, lte: toDate } },
      select: {
        pago: true,
        data_hora_inicio: true,
        pet: { select: { nome: true } },
        tutor_profile: { select: { user: { select: { nome: true } } } },
        servicos: {
          select: {
            preco_snapshot: true,
            servico_variante: { select: { preco: true, servico: { select: { nome: true } } } },
          },
        },
        atendimento: { select: { adicionais: { select: { preco_cobrado: true } } } },
      },
      orderBy: { data_hora_inicio: 'asc' },
    })

    const rows = agendamentos.map((ag) => {
      const valorServicos = ag.servicos.reduce((s, sv) => s + Number(sv.preco_snapshot ?? sv.servico_variante.preco), 0)
      const valorAdicionais = ag.atendimento?.adicionais.reduce((s, a) => s + Number(a.preco_cobrado), 0) ?? 0
      return {
        data: ag.data_hora_inicio.toLocaleDateString('pt-BR'),
        hora: ag.data_hora_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        pet: ag.pet.nome,
        tutor: ag.tutor_profile.user.nome ?? '',
        servicos: ag.servicos.map((s) => s.servico_variante.servico.nome).join(' + '),
        valor_servicos: valorServicos.toFixed(2),
        valor_adicionais: valorAdicionais.toFixed(2),
        valor_total: (valorServicos + valorAdicionais).toFixed(2),
        pago: ag.pago ? 'Sim' : 'Não',
      }
    })

    reply.header('Content-Type', 'text/csv; charset=utf-8')
    reply.header('Content-Disposition', 'attachment; filename="atendimentos.csv"')
    return reply.send('﻿' + toCsv(rows))
  })

  app.get('/reports/servicos.csv', async (req, reply) => {
    const { petshopId, from, to } = req.query as { petshopId?: string; from?: string; to?: string }
    if (!petshopId || !from || !to) return reply.status(400).send({ error: 'petshopId, from e to são obrigatórios' })
    const range = validateRange(reply, from, to)
    if (!range) return
    const { fromDate, toDate } = range

    if (!(await resolveOwner(req, prisma, petshopId))) return reply.status(403).send({ error: 'Apenas owner' })

    const servicos = await prisma.agendamentoServico.findMany({
      where: { agendamento: { petshop_id: petshopId, status: 'Finalizado', data_hora_inicio: { gte: fromDate, lte: toDate } } },
      select: {
        servico_variante_id: true,
        preco_snapshot: true,
        servico_variante: { select: { preco: true, servico: { select: { nome: true } } } },
      },
    })

    const map = new Map<string, { servico: string; quantidade: number; valorTotal: number }>()
    for (const s of servicos) {
      const key = s.servico_variante_id
      const preco = Number(s.preco_snapshot ?? s.servico_variante.preco)
      const existing = map.get(key)
      if (existing) { existing.quantidade++; existing.valorTotal += preco }
      else map.set(key, { servico: s.servico_variante.servico.nome, quantidade: 1, valorTotal: preco })
    }

    const rows = Array.from(map.values()).map((v) => ({
      servico: v.servico,
      quantidade: v.quantidade,
      valor_total: v.valorTotal.toFixed(2),
      valor_medio: (v.quantidade > 0 ? v.valorTotal / v.quantidade : 0).toFixed(2),
    }))

    reply.header('Content-Type', 'text/csv; charset=utf-8')
    reply.header('Content-Disposition', 'attachment; filename="servicos.csv"')
    return reply.send('﻿' + toCsv(rows))
  })

  app.get('/reports/pacotes.csv', async (req, reply) => {
    const { petshopId, from, to } = req.query as { petshopId?: string; from?: string; to?: string }
    if (!petshopId || !from || !to) return reply.status(400).send({ error: 'petshopId, from e to são obrigatórios' })
    const range = validateRange(reply, from, to)
    if (!range) return
    const { fromDate, toDate } = range

    if (!(await resolveOwner(req, prisma, petshopId))) return reply.status(403).send({ error: 'Apenas owner' })

    const vendidos = await prisma.pacotePet.findMany({
      where: { pacote: { petshop_id: petshopId }, data_ativacao: { gte: fromDate, lte: toDate } },
      select: {
        data_ativacao: true,
        valor_total_snapshot: true,
        pacote: { select: { nome: true } },
        pet: { select: { nome: true } },
      },
      orderBy: { data_ativacao: 'asc' },
    })

    const rows = vendidos.map((p) => ({
      data_ativacao: new Date(p.data_ativacao).toLocaleDateString('pt-BR'),
      pacote: p.pacote.nome,
      pet: p.pet.nome,
      valor_total: Number(p.valor_total_snapshot ?? 0).toFixed(2),
    }))

    reply.header('Content-Type', 'text/csv; charset=utf-8')
    reply.header('Content-Disposition', 'attachment; filename="pacotes.csv"')
    return reply.send('﻿' + toCsv(rows))
  })
}
