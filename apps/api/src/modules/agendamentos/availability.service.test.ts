import { describe, it, expect } from 'vitest'
import { getAvailableSlots, getAvailableBanhistas } from './availability.service.js'
import type { DiaFuncionamento, AgendamentoInput, BloqueioInput, BanhistaInput } from './availability.service.js'

const SEGUNDA: DiaFuncionamento = { weekday: 1, ativo: true, faixas: [{ abre: '08:00', fecha: '18:00' }] }
const HORARIO_SIMPLES: DiaFuncionamento[] = [
  { weekday: 0, ativo: false, faixas: [] },
  SEGUNDA,
  { weekday: 2, ativo: true, faixas: [{ abre: '08:00', fecha: '12:00' }, { abre: '14:00', fecha: '18:00' }] },
  { weekday: 3, ativo: true, faixas: [{ abre: '08:00', fecha: '18:00' }] },
  { weekday: 4, ativo: true, faixas: [{ abre: '08:00', fecha: '18:00' }] },
  { weekday: 5, ativo: true, faixas: [{ abre: '08:00', fecha: '18:00' }] },
  { weekday: 6, ativo: false, faixas: [] },
]

const banhista1: BanhistaInput = { id: 'b1', nome: 'Ana', ativo: true }
const banhista2: BanhistaInput = { id: 'b2', nome: 'Bruno', ativo: true }
const banhistaInativo: BanhistaInput = { id: 'b3', nome: 'Carlos', ativo: false }

const semAgendamentos: AgendamentoInput[] = []
const semBloqueios: BloqueioInput[] = []

const SEGUNDA_DATE = '2025-06-02'  // uma segunda-feira
const DOMINGO_DATE = '2025-06-01'  // domingo
const SABADO_DATE = '2025-06-07'   // sábado

function makeAgendamento(banhistaId: string, hora: string, duracao: number): AgendamentoInput {
  return {
    id: `ag-${Math.random()}`,
    banhistaId,
    dataHoraInicio: new Date(`${SEGUNDA_DATE}T${hora}:00`),
    duracaoTotalMinutos: duracao,
    status: 'Confirmado',
  }
}

function makeBloqueio(banhistaId: string | null, horaInicio: string, horaFim: string): BloqueioInput {
  return {
    id: `bl-${Math.random()}`,
    banhistaId,
    dataInicio: new Date(`${SEGUNDA_DATE}T${horaInicio}:00`),
    dataFim: new Date(`${SEGUNDA_DATE}T${horaFim}:00`),
  }
}

// Agora no passado para evitar filtro de "horários passados"
const AGORA_NO_INICIO_DO_DIA = new Date(`${SEGUNDA_DATE}T00:00:00`)

describe('getAvailableSlots', () => {
  it('dia fechado (domingo) retorna []', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: DOMINGO_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    expect(slots).toHaveLength(0)
  })

  it('sábado fechado retorna []', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SABADO_DATE,
      duracaoMin: 60,
      agora: new Date(`${SABADO_DATE}T00:00:00`),
    })
    expect(slots).toHaveLength(0)
  })

  it('horário funcionamento vazio retorna []', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: [],
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    expect(slots).toHaveLength(0)
  })

  it('sem banhistas retorna []', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    expect(slots).toHaveLength(0)
  })

  it('banhista inativo não gera slots', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhistaInativo],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    expect(slots).toHaveLength(0)
  })

  it('dia com funcionamento gera slots válidos (1 banhista)', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    expect(slots.length).toBeGreaterThan(0)
    expect(slots[0]!.banhistaId).toBe('b1')
    // Primeiro slot deve começar em 08:00
    expect(new Date(slots[0]!.inicio).getHours()).toBe(8)
    expect(new Date(slots[0]!.inicio).getMinutes()).toBe(0)
  })

  it('slots têm fim = inicio + duracaoMin', () => {
    const duracao = 90
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 15,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: duracao,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    for (const slot of slots) {
      const diff = (new Date(slot.fim).getTime() - new Date(slot.inicio).getTime()) / 60000
      expect(diff).toBe(duracao)
    }
  })

  it('agendamento existente bloqueia horário do mesmo banhista', () => {
    const ag = makeAgendamento('b1', '08:00', 60)
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: [ag],
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    // 08:00 deve estar bloqueado
    const temOito = slots.some((s) => new Date(s.inicio).getHours() === 8 && new Date(s.inicio).getMinutes() === 0)
    expect(temOito).toBe(false)
  })

  it('buffer (intervalo entre banhos) é aplicado', () => {
    const ag = makeAgendamento('b1', '08:00', 60) // término 09:00
    const intervalo = 30 // buffer 30min → próximo slot livre: 09:30
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: intervalo,
      agendamentos: [ag],
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    // 09:00 deve estar bloqueado por buffer
    const temNove = slots.some((s) => new Date(s.inicio).getHours() === 9 && new Date(s.inicio).getMinutes() === 0)
    expect(temNove).toBe(false)
    // 09:30 deve estar disponível
    const temNoveMeia = slots.some((s) => new Date(s.inicio).getHours() === 9 && new Date(s.inicio).getMinutes() === 30)
    expect(temNoveMeia).toBe(true)
  })

  it('bloqueio de loja inteira (banhistaId null) bloqueia todos os banhistas', () => {
    const bl = makeBloqueio(null, '08:00', '10:00')
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: [bl],
      banhistas: [banhista1, banhista2],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    const temOito = slots.some((s) => {
      const h = new Date(s.inicio).getHours()
      const m = new Date(s.inicio).getMinutes()
      return h === 8 && m === 0
    })
    expect(temOito).toBe(false)
    // 10:00 deve estar disponível
    const temDez = slots.some((s) => new Date(s.inicio).getHours() === 10 && new Date(s.inicio).getMinutes() === 0)
    expect(temDez).toBe(true)
  })

  it('bloqueio por banhista específico não afeta o outro', () => {
    const bl = makeBloqueio('b1', '08:00', '12:00')
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: [bl],
      banhistas: [banhista1, banhista2],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    // deve haver slot às 08:00 (b2 livre)
    const b2Oito = slots.some((s) => new Date(s.inicio).getHours() === 8 && s.banhistaId === 'b2')
    expect(b2Oito).toBe(true)
    // b1 não deve aparecer antes das 12:00
    const b1Antes = slots.some((s) => new Date(s.inicio).getHours() < 12 && s.banhistaId === 'b1')
    expect(b1Antes).toBe(false)
  })

  it('dois banhistas livres → aparece 1 slot por horário (sem preferência)', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1, banhista2],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    // sem preferência, cada horário aparece uma única vez
    const horarios = slots.map((s) => s.inicio)
    const unicos = new Set(horarios)
    expect(horarios.length).toBe(unicos.size)
  })

  it('com banhistaId específico, só aparece esse banhista nos slots', () => {
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1, banhista2],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      banhistaId: 'b2',
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    expect(slots.every((s) => s.banhistaId === 'b2')).toBe(true)
  })

  it('banhista único ocupado em slot solicitado → slot indisponível', () => {
    const ag = makeAgendamento('b1', '10:00', 120) // 10:00–12:00
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: [ag],
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      banhistaId: 'b1',
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    const temDez = slots.some((s) => new Date(s.inicio).getHours() === 10)
    const temOnze = slots.some((s) => new Date(s.inicio).getHours() === 11)
    expect(temDez).toBe(false)
    expect(temOnze).toBe(false)
  })

  it('duas faixas horárias (manhã e tarde) geram slots em ambas', () => {
    const TERCA_DATE = '2025-06-03' // terça = weekday 2 = faixas 08-12 e 14-18
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: TERCA_DATE,
      duracaoMin: 60,
      agora: new Date(`${TERCA_DATE}T00:00:00`),
    })
    const manha = slots.some((s) => new Date(s.inicio).getHours() < 12)
    const tarde = slots.some((s) => new Date(s.inicio).getHours() >= 14)
    expect(manha).toBe(true)
    expect(tarde).toBe(true)
    // não deve haver slot no intervalo 12:00–13:59
    const intervalo = slots.some((s) => {
      const h = new Date(s.inicio).getHours()
      return h === 12 || h === 13
    })
    expect(intervalo).toBe(false)
  })

  it('horários passados não são retornados quando agora > inicio do dia', () => {
    const agoraMeioTarde = new Date(`${SEGUNDA_DATE}T14:00:00`)
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: agoraMeioTarde,
    })
    const temManha = slots.some((s) => new Date(s.inicio).getHours() < 14)
    expect(temManha).toBe(false)
  })

  it('agendamento cancelado não bloqueia horário', () => {
    const ag: AgendamentoInput = {
      ...makeAgendamento('b1', '08:00', 60),
      status: 'Cancelado',
    }
    const slots = getAvailableSlots({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: [ag],
      bloqueios: semBloqueios,
      banhistas: [banhista1],
      date: SEGUNDA_DATE,
      duracaoMin: 60,
      agora: AGORA_NO_INICIO_DO_DIA,
    })
    const temOito = slots.some((s) => new Date(s.inicio).getHours() === 8 && new Date(s.inicio).getMinutes() === 0)
    expect(temOito).toBe(true)
  })
})

describe('getAvailableBanhistas', () => {
  it('retorna banhistas livres no slot', () => {
    const livres = getAvailableBanhistas({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: semAgendamentos,
      bloqueios: semBloqueios,
      banhistas: [banhista1, banhista2],
      inicio: `${SEGUNDA_DATE}T10:00:00`,
      duracaoMin: 60,
    })
    expect(livres.map((b) => b.id)).toContain('b1')
    expect(livres.map((b) => b.id)).toContain('b2')
  })

  it('banhista ocupado não aparece na lista', () => {
    const ag = makeAgendamento('b1', '10:00', 60)
    const livres = getAvailableBanhistas({
      horarioFuncionamento: HORARIO_SIMPLES,
      intervaloEntreMin: 0,
      agendamentos: [ag],
      bloqueios: semBloqueios,
      banhistas: [banhista1, banhista2],
      inicio: `${SEGUNDA_DATE}T10:00:00`,
      duracaoMin: 60,
    })
    expect(livres.map((b) => b.id)).not.toContain('b1')
    expect(livres.map((b) => b.id)).toContain('b2')
  })
})
