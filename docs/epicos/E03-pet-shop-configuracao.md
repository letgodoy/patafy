# E03 — Pet Shop, Configuração e Equipe

| Campo | Valor |
| --- | --- |
| **ID** | E03 |
| **Fase** | MVP |
| **Dependências** | E00, E01, E02 |
| **Apps** | `api`, `web-admin`, `web-petshop`, `web-tutor` (leitura pública) |
| **Rastreabilidade** | RF03; CA ADM-06, ADM-07 |

## Objetivo

Onboarding de pet shops pelo admin sistema, configuração operacional (`config_json` v2 + **slug**), campos de localização para descoberta pelo tutor, gestão de equipe e bloqueios de agenda.

## Decisões aplicáveis

- **Slug personalizado** em `config_json` para URL da loja: `/loja/:slug` no `web-tutor`
- **Descoberta MVP:** listar lojas ativas; filtros por **cidade**, **estado**, **nome**
- **Geolocalização futura:** `PetShop.latitude` / `longitude` nullable — não usar na UI MVP; API aceita campos null

## Extensão do schema `PetshopConfigJsonV2`

Atualizar `docs/schemas/petshop-config-json.ts`:

```typescript
export interface PetshopConfigJsonV2 {
  // ...campos existentes...
  /**
   * Slug único para URL pública da loja (ex.: "petcare-centro").
   * Regex: ^[a-z0-9]+(?:-[a-z0-9]+)*$ — min 3, max 64 chars.
   * Único em todo o sistema (validar na API).
   */
  slug: string;
}
```

## Entidades

`PetShop`, `PetshopUserProfile`, `BloqueioAgenda`

## Regras de negócio

### Cadastro (system_admin via web-admin)

1. `PetShop`: nome_exibicao, razao_social, CNPJ (único), endereco, **cidade**, **estado** (UF 2 chars), telefone, email, contato financeiro, contato responsável
2. Criar 1 Owner: nome, CPF (obrigatório), email, telefone → `PetshopUserProfile` com `roles: [owner]`
3. Owner recebe e-mail de boas-vindas com link para `web-petshop` (opcional; pode ser manual no MVP)

### Configuração (owner via web-petshop)

Campos em `config_json` (validação Zod):

| Campo | Uso |
| --- | --- |
| `slug` | URL pública `/loja/:slug` |
| `animais_atendidos` | Filtro de pets aceitos |
| `restricoes_raca.racas_bloqueadas` | Raças não atendidas |
| `tamanhos_aceitos` | Portes aceitos |
| `aceita_pets_agressivos` | Default true se omitido |
| `intervalo_entre_banhos_minutos` | Buffer entre slots (mesmo banhista) |
| `horario_funcionamento` | Grade semanal (ADM-06) |
| `prazo_cancelamento_horas` | Limite cancelamento tutor |
| `prazo_remarcacao_horas` | Limite remarcação tutor |
| `politica_cancelamento` | Texto exibido na UI |
| `tolerancia_atraso_minutos` | Job → Atrasado |
| `cancelamento_automatico_apos_atraso` | Job → Cancelado automático |
| `nome`, `logo`, `cor_principal` | Branding na UI tutor |

### Equipe (owner)

- CRUD atendentes e banhistas: nome, CPF, email, telefone, roles acumuláveis
- Owner pode ter roles `[owner, atendente, banhista]` no mesmo perfil
- Desativar staff: `ativo = false` (não apagar)

### Bloqueios de agenda

- `BloqueioAgenda`: petshop_id, banhista_id (opcional — null = loja inteira), data_inicio, data_fim, motivo
- Bloqueios impedem slots (E06)

### Descoberta de lojas (tutor)

- Query `listPetShops(filter)`:
  - `ativo: true` (pet shop com pelo menos owner ativo)
  - Filtros: `cidade`, `estado`, `nome` (ILIKE)
  - Ordenação: nome_exibicao ASC
  - **Não** ordenar por distância no MVP (preparar argumento `near: { lat, lng, radiusKm }` como `@deprecated` ou comentário no schema para futuro)
- Query `petShopBySlug(slug)` — resolve via `config_json.slug` (índice funcional ou tabela de slug cache se performance exigir)

## API GraphQL (módulo `petshops`)

### Mutations admin

| Operação | Quem |
| --- | --- |
| `createPetShop` | system_admin |
| `createPetShopOwner` | system_admin |
| `deactivatePetShop` | system_admin |

### Mutations owner

| Operação | Quem |
| --- | --- |
| `updatePetShop` | owner |
| `updatePetShopConfig` | owner |
| `createStaff` / `updateStaff` / `deactivateStaff` | owner |
| `createBloqueio` / `deleteBloqueio` | owner, atendente |

### Queries

| Operação | Quem |
| --- | --- |
| `myPetShop` | staff B2B |
| `listPetShops` | tutor (público autenticado) |
| `petShopBySlug` | tutor |
| `petShopById` | tutor |
| `listStaff` | owner |
| `listBloqueios` | staff |

## Frontend

### web-admin

- `/petshops` — lista, criar loja, criar owner
- Formulário: todos os campos incluindo cidade/estado

### web-petshop

- `/configuracoes` — horários, políticas, filtros de aceite, slug, branding
- `/equipe` — CRUD staff
- `/bloqueios` — gestão de bloqueios (UI básica; uso completo com E06/E07)

### web-tutor

- `/lojas` — lista com filtros cidade/estado/nome
- `/loja/:slug` — página da loja (shell; catálogo no E05, agendamento no E07)
- Rota alternativa `/loja/id/:id` opcional para compatibilidade interna

## Validações críticas

- `slug` único global (case-insensitive)
- `slug` não pode ser palavra reservada (`admin`, `login`, `api`, etc.)
- CNPJ formato + unicidade
- `horario_funcionamento`: `fecha > abre` em cada faixa
- Estado: enum ou regex `^[A-Z]{2}$`

## Fora do escopo

- Geolocalização / mapa na UI
- Multi-unidade / franquias

## Critérios de aceite

- [ ] Admin cria pet shop + owner com CPF
- [ ] Owner configura horário de funcionamento (ADM-06)
- [ ] Owner define slug único
- [ ] Tutor lista lojas ativas com filtros cidade/estado/nome
- [ ] Tutor acede loja via `/loja/:slug`
- [ ] Owner cadastra banhistas (ADM-07 base)
- [ ] `config_json` validado contra Zod/TypeScript
- [ ] Campos lat/lng existem no schema mas não são obrigatórios

## Histórias sugeridas

1. Extender `petshop-config-json.ts` com `slug`
2. Mutations admin: createPetShop + owner
3. Owner: updateConfig com validação slug único
4. Queries listPetShops + petShopBySlug
5. UI web-admin: onboarding loja
6. UI web-petshop: config + equipe + bloqueios
7. UI web-tutor: listagem e página por slug
8. Testes: slug duplicado → erro

## Definição de pronto

Pet shops operacionais com config completa; tutores descobrem e acedem lojas por lista ou slug; equipe cadastrada com CPF.
