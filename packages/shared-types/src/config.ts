export type WeekdayBr = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface FaixaHorario {
  abre: string
  fecha: string
}

export interface DiaFuncionamento {
  ativo: boolean
  faixas: FaixaHorario[]
}

export interface PetshopConfigJsonV1 {
  schema_version: 1
  nome_exibicao?: string
  logo_url?: string
  tipos_animal_aceitos?: string[]
  portes_aceitos?: string[]
  aceita_agressivos?: boolean
}

export interface PetshopConfigJsonV2 {
  schema_version: 2
  nome_exibicao?: string
  logo_url?: string
  cor_primaria?: string
  slug?: string
  tipos_animal_aceitos?: string[]
  racas_aceitas?: string[]
  portes_aceitos?: string[]
  pelagens_aceitas?: string[]
  aceita_agressivos?: boolean
  horario_funcionamento?: Record<WeekdayBr, DiaFuncionamento>
  intervalo_entre_banhos_dias?: number
  prazo_cancelamento_horas?: number
  prazo_remarcacao_horas?: number
  tolerancia_atraso_minutos?: number
  cancelamento_automatico_apos_atraso?: boolean
  politica_cancelamento?: string
}

export type PetshopConfigJson = PetshopConfigJsonV1 | PetshopConfigJsonV2
