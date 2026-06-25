import type { PetShop, PetshopUserProfile, BloqueioAgenda, User } from '@patafy/db'

type PetShopConfigJson = Record<string, unknown>

function mapConfig(json: unknown) {
  const c = (json ?? {}) as PetShopConfigJson
  return {
    slug: (c['slug'] as string) ?? null,
    nome: (c['nome'] as string) ?? null,
    logo: (c['logo'] as string) ?? null,
    corPrincipal: (c['cor_principal'] as string) ?? null,
    animaisAtendidos: (c['animais_atendidos'] as string[]) ?? null,
    tamanhosAceitos: (c['tamanhos_aceitos'] as string[]) ?? null,
    aceitaPetsAgressivos: (c['aceita_pets_agressivos'] as boolean) ?? null,
    horarioFuncionamento: c['horario_funcionamento'] ? JSON.stringify(c['horario_funcionamento']) : null,
    intervaloBanhoMinutos: (c['intervalo_entre_banhos_minutos'] as number) ?? null,
    prazoCancelamentoHoras: (c['prazo_cancelamento_horas'] as number) ?? null,
    prazoRemarcacaoHoras: (c['prazo_remarcacao_horas'] as number) ?? null,
    politicaCancelamento: (c['politica_cancelamento'] as string) ?? null,
    toleranciaAtrasoMinutos: (c['tolerancia_atraso_minutos'] as number) ?? null,
    cancelamentoAutomaticoAposAtraso: (c['cancelamento_automatico_apos_atraso'] as boolean) ?? null,
  }
}

export function mapPetShop(ps: PetShop) {
  return {
    id: ps.id,
    nomeExibicao: ps.nome_exibicao,
    razaoSocial: ps.razao_social,
    cnpj: ps.cnpj,
    endereco: ps.endereco,
    cidade: ps.cidade,
    estado: ps.estado,
    telefone: ps.telefone ?? null,
    email: ps.email,
    ativo: ps.ativo,
    configJson: mapConfig(ps.config_json),
    createdAt: ps.created_at.toISOString(),
    updatedAt: ps.updated_at.toISOString(),
  }
}

export function mapStaffMember(profile: PetshopUserProfile & { user: User }) {
  return {
    id: profile.id,
    userId: profile.user_id,
    petshopId: profile.petshop_id,
    nome: profile.user.nome,
    email: profile.user.email,
    roles: profile.roles as string[],
    ativo: profile.ativo,
    createdAt: profile.created_at.toISOString(),
  }
}

export function mapBloqueio(b: BloqueioAgenda) {
  return {
    id: b.id,
    petshopId: b.petshop_id,
    banhistaId: b.banhista_id ?? null,
    dataInicio: b.data_inicio.toISOString(),
    dataFim: b.data_fim.toISOString(),
    motivo: b.motivo ?? null,
    createdAt: b.created_at.toISOString(),
  }
}
