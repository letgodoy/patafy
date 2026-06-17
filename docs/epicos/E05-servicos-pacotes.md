# E05 — Serviços, Pacotes e Categorias

| Campo | Valor |
| --- | --- |
| **ID** | E05 |
| **Fase** | MVP |
| **Dependências** | E02, E03 |
| **Apps** | `api`, `web-petshop`, `web-tutor` (leitura) |
| **Rastreabilidade** | RF06, PRD §4.2, §4.6; CA SRV-01, SRV-02, ADM-01, ADM-02 |

## Objetivo

CRUD de categorias, serviços com variantes, pacotes (travado e personalizável), venda de pacotes ao pet com wizard, e consulta de saldo de créditos pelo tutor.

## Decisões aplicáveis

- Nova tabela **`CategoriaServico`** por pet shop
- Venda de **pacote personalizável** via **wizard** no web-petshop

## Entidades

`CategoriaServico`, `Servico`, `ServicoVariante`, `Pacote`, `PacoteItem`, `PacotePet`

## Regras de negócio

### Categorias

- Por `petshop_id`: nome, ordem, ativo
- `Servico.categoria_id` opcional
- Categoria inativa: serviços mantêm referência mas não exibem categoria inativa em novos cadastros

### Serviços

1. Por loja: nome, descricao, ativo, categoria_id opcional
2. Variantes (`ServicoVariante`): porte_id obrigatório; raca_id e pelagem_id opcionais; duracao_minutos; preco
3. Serviço inativo não aparece para tutores
4. Listagem para tutor **filtrada** pelo pet selecionado (porte, raça, pelagem compatíveis)
5. Duração do slot = soma das variantes escolhidas no agendamento (E07)

### Pacotes

**Pacote travado (`travado: true`):**
- Composição fixa em `PacoteItem` (servico_id + quantidade_total)
- `valor_total` fixo na definição
- Variação de preço apenas via variantes por porte/pelagem na hora do uso

**Pacote personalizável (`travado: false`):**
- Template pode ter itens sugeridos ou vazio
- Na **venda**, atendente monta via wizard: N serviços × quantidades
- `desconto_percentual` opcional sobre soma dos itens (preço calculado)
- `valor_total` persistido no momento da venda

**Comum:**
- `validade` opcional em `PacotePet.data_expiracao`
- `PacotePet` liga pacote vendido ao pet
- Créditos: cada `PacoteItem.quantidade_total` = unidades; `quantidade_usada` atualizada no débito (E08)
- Pacote inativo não aparece para venda

### Wizard de venda (web-petshop)

Passos sugeridos:

1. Selecionar pet (tutor localizado ou contexto)
2. Escolher tipo: travado (catálogo) ou personalizável
3. Se travado: escolher pacote pré-definido → confirmar preço por porte/pelagem do pet
4. Se personalizável:
   - Adicionar linhas (serviço + quantidade + variante/preço resolvido)
   - Exibir subtotal em tempo real
   - Campo desconto % opcional
   - Total final
5. Confirmar → `venderPacote` → `PacotePet` + itens

## API GraphQL

### Módulo `servicos` (owner)

| Operação | Descrição |
| --- | --- |
| `createCategoria` / `updateCategoria` | CRUD categoria |
| `createServico` / `updateServico` | CRUD serviço |
| `createServicoVariante` / `updateServicoVariante` | Variantes |
| `deactivateServico` | Soft via ativo=false |

### Módulo `pacotes`

| Operação | Quem | Descrição |
| --- | --- | --- |
| `createPacote` / `updatePacote` | owner | Definição |
| `venderPacoteTravado` | staff | Venda pacote fixo |
| `venderPacotePersonalizado` | staff | Wizard → input: itens[] + desconto% |
| `listPacotesPorPet` | tutor, staff | Saldo créditos |
| `listServicos(petShopId, petId)` | tutor | Filtrado por pet |
| `getServico` | tutor | Detalhe SRV-02 |

### Resposta saldo pacote (tutor)

Por `PacotePet`:
- servico, quantidade_total, quantidade_usada, restante
- data_expiracao
- status: ativo | expirado | esgotado

## Frontend

### web-petshop

- `/servicos` — lista por categoria
- `/servicos/novo`, `/servicos/:id` — CRUD + variantes
- `/categorias` — CRUD categorias
- `/pacotes` — CRUD definições
- `/pacotes/vender` — **wizard** venda

### web-tutor

- Na página `/loja/:slug/servicos` — SRV-01, SRV-02
- `/pets/:id/pacotes` — saldo de créditos

## Fora do escopo

- Dependência rígida entre serviços (hidratação exige banho) — nice to have
- Pacotes recorrentes

## Critérios de aceite

- [ ] CA SRV-01, SRV-02, ADM-01, ADM-02
- [ ] Categorias ordenáveis e filtráveis na listagem
- [ ] Pet grande só vê variantes compatíveis
- [ ] Wizard personalizável calcula total com desconto %
- [ ] Tutor vê saldo usado/restante por pacote
- [ ] Pacote expirado marcado como tal (não vendável)

## Histórias sugeridas

1. CRUD CategoriaServico
2. CRUD Servico + variantes com filtros por pet
3. CRUD Pacote travado
4. venderPacotePersonalizado + cálculo preço
5. Queries tutor listServicos / pacotes
6. UI petshop: serviços, categorias, pacotes
7. UI petshop: wizard venda (4-5 passos)
8. UI tutor: serviços e saldo pacotes
9. Testes: filtro por porte, preço personalizado

## Definição de pronto

Catálogo completo por loja; tutor navega serviços filtrados; staff vende pacotes via wizard; saldo de créditos visível.
