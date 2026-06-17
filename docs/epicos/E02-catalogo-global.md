# E02 — Catálogo Global (Admin do Sistema)

| Campo | Valor |
| --- | --- |
| **ID** | E02 |
| **Fase** | MVP |
| **Dependências** | E00, E01 |
| **Apps** | `api`, `web-admin` |
| **Rastreabilidade** | RF02.1, RF04; CA ADM-CAT-01 |

## Objetivo

CRUD universal de **TipoAnimal**, **Raca**, **Porte** e **Pelagem** — catálogo compartilhado por todos os pet shops, gerido exclusivamente pelo administrador do sistema via `web-admin`.

## Entidades

`TipoAnimal`, `Raca`, `Porte`, `Pelagem`

## Regras de negócio

1. Apenas `system_admin` pode criar, editar ou inativar itens.
2. Qualquer utilizador autenticado pode **ler** itens ativos (cadastro de pet, config de loja).
3. `Raca.tipo_animal_id` é **obrigatório** — raça sempre vinculada a um tipo.
4. Inativação via `ativo = false` (soft); itens inativos **não** aparecem em selects de novos registros.
5. Campo `ordem` opcional para ordenação na UI.
6. Cache de leitura na API com TTL curto (~60s) — invalidar em mutations (RNF02).

## API GraphQL (módulo `catalogo-global`)

### Queries (autenticadas)

| Operação | Descrição |
| --- | --- |
| `tiposAnimal(ativo: Boolean)` | Lista paginada |
| `racas(tipoAnimalId, ativo)` | Filtrar por tipo |
| `portes(ativo)` | Lista |
| `pelagens(ativo)` | Lista |

### Mutations (system_admin)

| Operação | Descrição |
| --- | --- |
| `createTipoAnimal` / `updateTipoAnimal` | CRUD tipo |
| `createRaca` / `updateRaca` | CRUD raça (exige tipo) |
| `createPorte` / `updatePorte` | CRUD porte |
| `createPelagem` / `updatePelagem` | CRUD pelagem |
| `setCatalogItemAtivo` | Ativar/inativar qualquer entidade |

### Gestão de admins (RF04.2)

| Operação | Descrição |
| --- | --- |
| `createSystemAdmin` | Cria User + flag/claim system_admin |
| `listSystemAdmins` | Lista admins (preparar futuras roles internas) |

## Frontend (`web-admin`)

### Rotas

- `/catalogo/tipos` — CRUD TipoAnimal
- `/catalogo/racas` — CRUD Raca (select de tipo obrigatório)
- `/catalogo/portes` — CRUD Porte
- `/catalogo/pelagens` — CRUD Pelagem
- `/admins` — gestão de administradores (RF04.2)

### UX

- Tabelas com busca, paginação, toggle ativo/inativo
- Confirmação antes de inativar item em uso (aviso; não bloquear se pet já referencia)
- Layout admin com sidebar de navegação

## Fora do escopo

- Importação em massa CSV
- Tradução/i18n de nomes

## Critérios de aceite

- [ ] CRUD completo dos 4 tipos de catálogo
- [ ] Raça sem `tipo_animal_id` → erro de validação
- [ ] Item inativo não aparece em dropdowns de cadastro (pet, serviço)
- [ ] Não-admin não consegue mutations de escrita
- [ ] Admin pode cadastrar outro admin (RF04.2)
- [ ] CA ADM-CAT-01 satisfeito

## Histórias sugeridas

1. Resolvers + serviços CRUD catálogo global
2. Testes: autorização system_admin
3. Cache de leitura + invalidação
4. UI web-admin: páginas de catálogo
5. UI web-admin: gestão de admins
6. Testes integração GraphQL

## Definição de pronto

Administrador gere catálogo universal pela `web-admin`; tutores e pet shops consomem dados ativos via queries GraphQL.
