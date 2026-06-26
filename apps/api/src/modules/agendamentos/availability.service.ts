/**
 * AvailabilityService — calcula slots livres para um dia/duração dado.
 * Sem dependências HTTP; injetável e testável de forma unitária.
 */

export interface FaixaHorario {
  abre: string  // HH:mm
  fecha: string // HH:mm
}

export interface DiaFuncionamento {
  weekday: number // 0=dom … 6=sab
  ativo: boolean
  faixas: FaixaHorario[]
}

export interface BloqueioInput {
  id: string
  banhistaId: string | null
  dataInicio: Date
  dataFim: Date
}

export interface AgendamentoInput {
  id: string
  banhistaId: string | null
  dataHoraInicio: Date
  duracaoTotalMinutos: number
  status: string
}

export interface BanhistaInput {
  id: string
  nome: string
  ativo: boolean
}

export interface SlotDisponivel {
  inicio: string        // ISO 8601
  fim: string           // ISO 8601
  banhistaId: string
  banhistaNome: string
}

export interface BanhistaLivre {
  id: string
  nome: string
}

const CANCELLED_STATUSES = new Set(['Cancelado', 'Finalizado', 'NaoCompareceu'])

/** Converte HH:mm em minutos desde meia-noite. */
function hmToMin(hm: string): number {
  const parts = hm.split(':').map(Number)
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

/** Retorna todos os slots de `[inicio, inicio + duracao)` que cabem dentro de faixas, excluindo passado. */
function gerarCandidatos(
  faixas: FaixaHorario[],
  duracaoMin: number,
  dataBase: Date,       // meia-noite local (usamos como referência absoluta)
  intervaloMin: number, // granularidade do grid, em minutos
  agora: Date,
): Array<{ inicioMin: number; fimMin: number }> {
  const candidatos: Array<{ inicioMin: number; fimMin: number }> = []
  const agoraTotalMin = agora.getHours() * 60 + agora.getMinutes()
  const isHoje = isSameDay(dataBase, agora)

  for (const faixa of faixas) {
    const abre = hmToMin(faixa.abre)
    const fecha = hmToMin(faixa.fecha)
    let cursor = abre
    while (cursor + duracaoMin <= fecha) {
      if (!isHoje || cursor > agoraTotalMin) {
        candidatos.push({ inicioMin: cursor, fimMin: cursor + duracaoMin })
      }
      cursor += intervaloMin
    }
  }
  return candidatos
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Converte minutos-do-dia em Date UTC para o dia dado. */
function minToDate(dataBase: Date, minutos: number): Date {
  const d = new Date(dataBase)
  d.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0)
  return d
}

/** Verifica se dois intervalos se sobrepõem (exclusive endpoints). */
function intersecta(
  aIni: number, aFim: number,
  bIni: number, bFim: number,
): boolean {
  return aIni < bFim && bIni < aFim
}

/** Para um banhista, retorna os intervalos ocupados (em minutos-do-dia) na data. */
function intervaloOcupados(
  banhistaId: string,
  agendamentos: AgendamentoInput[],
  bloqueios: BloqueioInput[],
  dataBase: Date,
  intervaloEntreMin: number,
): Array<{ ini: number; fim: number }> {
  const ocupados: Array<{ ini: number; fim: number }> = []

  for (const ag of agendamentos) {
    if (CANCELLED_STATUSES.has(ag.status)) continue
    if (ag.banhistaId !== banhistaId) continue
    if (!isSameDay(ag.dataHoraInicio, dataBase)) continue

    const ini = ag.dataHoraInicio.getHours() * 60 + ag.dataHoraInicio.getMinutes()
    // adiciona buffer pós-atendimento
    const fim = ini + ag.duracaoTotalMinutos + intervaloEntreMin
    ocupados.push({ ini, fim })
  }

  for (const bl of bloqueios) {
    // bloqueio se aplica ao banhista específico ou à loja inteira (banhistaId null)
    if (bl.banhistaId !== null && bl.banhistaId !== banhistaId) continue

    // converte para minutos-do-dia (bloqueio pode abranger múltiplos dias — usar o trecho do dia)
    const blIniMin = isSameDay(bl.dataInicio, dataBase)
      ? bl.dataInicio.getHours() * 60 + bl.dataInicio.getMinutes()
      : 0
    const blFimMin = isSameDay(bl.dataFim, dataBase)
      ? bl.dataFim.getHours() * 60 + bl.dataFim.getMinutes()
      : 24 * 60

    // se bloqueio cobre o dia (inicio antes ou no dia e fim depois)
    const cobre =
      bl.dataInicio <= new Date(dataBase.getTime() + 24 * 3600 * 1000) &&
      bl.dataFim > dataBase
    if (cobre) ocupados.push({ ini: blIniMin, fim: blFimMin })
  }

  return ocupados
}

export interface AvailabilitySlotsParams {
  horarioFuncionamento: DiaFuncionamento[]
  intervaloEntreMin: number
  agendamentos: AgendamentoInput[]
  bloqueios: BloqueioInput[]
  banhistas: BanhistaInput[]
  /** Data como YYYY-MM-DD (dia local da loja). */
  date: string
  duracaoMin: number
  /** Se fornecido, só considera este banhista. */
  banhistaId?: string
  agora?: Date
}

/**
 * Retorna slots disponíveis para um dia, ordenados por horário.
 * Cada slot tem o primeiro banhista livre (ou o banhista solicitado).
 */
export function getAvailableSlots(params: AvailabilitySlotsParams): SlotDisponivel[] {
  const {
    horarioFuncionamento,
    intervaloEntreMin,
    agendamentos,
    bloqueios,
    banhistas,
    date,
    duracaoMin,
    banhistaId,
    agora = new Date(),
  } = params

  // Parse date local
  const parts = date.split('-').map(Number)
  const ano = parts[0] ?? new Date().getFullYear()
  const mes = parts[1] ?? 1
  const dia = parts[2] ?? 1
  const dataBase = new Date(ano, mes - 1, dia, 0, 0, 0, 0)
  const weekday = dataBase.getDay() // 0=dom

  const diaConfig = horarioFuncionamento.find((d) => d.weekday === weekday)
  if (!diaConfig || !diaConfig.ativo || diaConfig.faixas.length === 0) return []

  // granularidade do grid: mínimo de 15min ou o intervalo entre banhos
  const grid = Math.max(15, intervaloEntreMin)

  const candidatos = gerarCandidatos(diaConfig.faixas, duracaoMin, dataBase, grid, agora)

  const banhistasElegiveis = banhistas.filter(
    (b) => b.ativo && (banhistaId == null || b.id === banhistaId),
  )

  const slots: SlotDisponivel[] = []
  const vistos = new Set<string>() // evita duplicatas por banhistas diferentes no mesmo horário

  for (const cand of candidatos) {
    for (const banhista of banhistasElegiveis) {
      const ocupados = intervaloOcupados(banhista.id, agendamentos, bloqueios, dataBase, intervaloEntreMin)
      const livre = !ocupados.some((o) => intersecta(cand.inicioMin, cand.fimMin, o.ini, o.fim))
      if (!livre) continue

      const key = `${cand.inicioMin}`
      if (!banhistaId && vistos.has(key)) break // sem preferência: 1 slot por horário

      vistos.add(key)
      slots.push({
        inicio: minToDate(dataBase, cand.inicioMin).toISOString(),
        fim: minToDate(dataBase, cand.fimMin).toISOString(),
        banhistaId: banhista.id,
        banhistaNome: banhista.nome,
      })
      if (!banhistaId) break // pega o primeiro disponível neste horário
    }
  }

  return slots
}

/**
 * Retorna todos os banhistas que têm o slot `[inicio, inicio+duracao)` livre.
 */
export function getAvailableBanhistas(params: {
  horarioFuncionamento: DiaFuncionamento[]
  intervaloEntreMin: number
  agendamentos: AgendamentoInput[]
  bloqueios: BloqueioInput[]
  banhistas: BanhistaInput[]
  inicio: string   // ISO 8601
  duracaoMin: number
  agora?: Date
}): BanhistaLivre[] {
  const { agendamentos, bloqueios, banhistas, inicio, duracaoMin, intervaloEntreMin } = params

  const inicioDate = new Date(inicio)
  const ano = inicioDate.getFullYear()
  const mes = inicioDate.getMonth()
  const dia = inicioDate.getDate()
  const dataBase = new Date(ano, mes, dia, 0, 0, 0, 0)
  const inicioMin = inicioDate.getHours() * 60 + inicioDate.getMinutes()
  const fimMin = inicioMin + duracaoMin

  return banhistas
    .filter((b) => b.ativo)
    .filter((b) => {
      const ocupados = intervaloOcupados(b.id, agendamentos, bloqueios, dataBase, intervaloEntreMin)
      return !ocupados.some((o) => intersecta(inicioMin, fimMin, o.ini, o.fim))
    })
    .map((b) => ({ id: b.id, nome: b.nome }))
}
