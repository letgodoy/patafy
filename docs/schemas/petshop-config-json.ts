/**
 * Contrato de `PetShop.config_json` (PostgreSQL jsonb).
 *
 * - Manter em sync com validação na API (ex.: Zod) e com `packages/shared-types` quando existir.
 * - `schema_version` discrimina evoluções; migrar registos antigos ao alterar o shape.
 */

/** Versão atual do documento em `config_json`. Incrementar em mudanças incompatíveis. */
export const PETSHOP_CONFIG_JSON_SCHEMA_VERSION = 2 as const;

/** Versões aceites na leitura (para migração gradual). */
export type PetshopConfigJsonSchemaVersion = 1 | 2;

/** Identificadores do catálogo global (UUID em string). */
export type CatalogId = string;

/** Dia da semana: **0 = domingo** … **6 = sábado** (convenção PT-BR comum em UI). */
export type WeekdayBr = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** Uma faixa de funcionamento num dia (horário local da loja, sem timezone no JSON). */
export interface FaixaHorario {
  /** Formato `HH:mm` (24h). */
  abre: string;
  /** Formato `HH:mm` (24h); deve ser > `abre` na mesma faixa. */
  fecha: string;
}

/** Configuração de um dia da semana. */
export interface DiaFuncionamento {
  weekday: WeekdayBr;
  /** Se `false`, loja fechada neste dia (ignorar `faixas`). */
  ativo: boolean;
  /** Uma ou mais faixas (ex.: manhã e tarde). */
  faixas: FaixaHorario[];
}

/**
 * Configuração de marca, regras de aceite e políticas operacionais (PRD RF03 §4, §9, premissas).
 * Campos opcionais: semântica na implementação (ex.: omitir `tamanhos_aceitos` = sem filtro extra).
 */
export interface PetshopConfigJsonV2 {
  schema_version: 2;

  /** Nome de marca / exibição curta (complementa `PetShop.nome_exibicao`). */
  nome: string;

  /** URL pública do logotipo (https). */
  logo?: string;

  /** Cor principal da loja para tema UI (hex, ex.: `#0d9488`). */
  cor_principal?: string;

  /** Tipos de animais atendidos (ids de `TipoAnimal`). */
  animais_atendidos: CatalogId[];

  /** Restrições por raça. */
  restricoes_raca?: {
    racas_bloqueadas?: CatalogId[];
  };

  /** Portes aceites (ids de `Porte`). */
  tamanhos_aceitos?: CatalogId[];

  /** Se `false`, não aceitar pets com `Pet.agressivo === true`. Default na API: `true` se omitido. */
  aceita_pets_agressivos?: boolean;

  /**
   * Intervalo mínimo entre fim de um atendimento e início do próximo **no mesmo banhista**
   * (buffer na geração de slots). PRD RF03 item «tempo de intervalo entre banhos».
   */
  intervalo_entre_banhos_minutos?: number;

  /** Grade semanal de funcionamento (PRD RF03 / ADM-06). Timezone = do pet shop na aplicação. */
  horario_funcionamento?: DiaFuncionamento[];

  /**
   * Tutor pode cancelar até esta quantidade de **horas** antes de `data_hora_inicio`.
   * PRD RF03 / tutor cancela até X horas.
   */
  prazo_cancelamento_horas?: number;

  /** Idem para **remarcação** pelo tutor (se omitido, reutilizar `prazo_cancelamento_horas` ou política na API). */
  prazo_remarcacao_horas?: number;

  /** Texto livre exibido na confirmação de cancelamento (PRD RF03 «política de cancelamento»). */
  politica_cancelamento?: string;

  /**
   * Após `data_hora_inicio + tolerancia_atraso_minutos`, o job/worker pode marcar **Atrasado** ou aplicar
   * cancelamento automático conforme regra de negócio (PRD estados / RF08.5).
   */
  tolerancia_atraso_minutos?: number;

  /**
   * Se `true`, após tolerância de atraso o sistema transiciona para cancelamento automático (RF08.5).
   * Se `false` ou omitido, apenas estado **Atrasado** ou notificação interna — definir na implementação.
   */
  cancelamento_automatico_apos_atraso?: boolean;
}

/** Shape legado (schema_version 1) — apenas branding e filtros; migrar para v2. */
export interface PetshopConfigJsonV1 {
  schema_version: 1;
  nome: string;
  logo?: string;
  cor_principal?: string;
  animais_atendidos: CatalogId[];
  restricoes_raca?: { racas_bloqueadas?: CatalogId[] };
  tamanhos_aceitos?: CatalogId[];
}

export type PetshopConfigJson = PetshopConfigJsonV1 | PetshopConfigJsonV2;
