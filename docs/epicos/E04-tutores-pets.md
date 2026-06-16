# E04 — Tutores, Pets e Compartilhamento

| Campo | Valor |
| --- | --- |
| **ID** | E04 |
| **Fase** | MVP |
| **Dependências** | E01, E02, E03 |
| **Apps** | `api`, `web-tutor`, `web-petshop` |
| **Rastreabilidade** | RF01, RF02, RF05; CA TUT-01, PET-01, PET-02, PET-03 |

## Objetivo

Cadastro global de tutores e pets, compartilhamento multi-tutor via convite, cadastro assistido pelo atendente com e-mail de definição de senha, e observações por loja.

## Decisões aplicáveis

- Cadastro pelo atendente **sem senha** → disparar **e-mail Firebase password reset** / link de definição de senha
- Tutor global — **sem** vínculo FK com PetShop

## Entidades

`TutorProfile`, `Pet`, `PetTutor`, `PetTutorConvite`

## Regras de negócio

### Tutor

1. Único por CPF e e-mail no sistema.
2. Pode agendar em vários pet shops ao longo do tempo (relação derivada de agendamentos).
3. Auto-cadastro via `web-tutor` (E01) ou cadastro assistido pelo atendente.

### Cadastro assistido (atendente)

1. Atendente busca tutor por CPF ou e-mail.
2. Se não existe: `createTutorAssisted` cria `User` (sem senha Firebase ainda) + `TutorProfile`.
3. API cria utilizador Firebase com e-mail e envia **link de definição de senha** (Firebase `generatePasswordResetLink` ou equivalente).
4. Alternativa aceite: criar conta Firebase com senha temporária e forçar reset no primeiro login — preferir link por e-mail.
5. Atendente **não** define senha no formulário.

### Pets

1. Máximo **30 pets** por tutor responsável.
2. `tipo_animal_id` **obrigatório**; raça, porte, pelagem do catálogo global.
3. Campos: nome, idade, peso, agressivo, cuidados_especiais, obs_compartilhadas.
4. **Soft delete:** `deleted_at`; listagens `WHERE deleted_at IS NULL` (PET-03).
5. Pet shop só agenda pets que passam nos filtros da loja (`animais_atendidos`, porte, raça, agressivo).

### Observações

- `obs_internas` (jsonb): `{ "[petshop_uuid]": "texto" }` — cada loja só lê/escreve a própria chave.
- `obs_compartilhadas`: visível ao tutor e à loja que escreveu; tutor vê de todas as lojas.

### Compartilhamento (RF02.4)

1. Tutor **responsável** convida por e-mail → `PetTutorConvite` (token hash, `expires_at`, status `pendente`).
2. Máximo 1 convite **pendente** por `(pet_id, convidado_email)`.
3. Convidado regista-se ou faz login com o **mesmo e-mail** → aceita convite via token/link.
4. Aceite válido → `PetTutor` com `tipo = autorizado`.
5. Estados: `pendente | aceito | expirado | revogado`.

## API GraphQL (módulo `pets`)

### Queries tutor

| Operação | Descrição |
| --- | --- |
| `myPets` | Pets do tutor (responsável + autorizado) |
| `pet(id)` | Detalhe com obs_compartilhadas |
| `myPetTutorConvites` | Convites enviados/recebidos |

### Queries staff

| Operação | Descrição |
| --- | --- |
| `searchTutor(cpf \| email)` | Localizar tutor global |
| `petForShop(id)` | Pet com obs_internas da loja atual |

### Mutations tutor

| Operação | Descrição |
| --- | --- |
| `createPet` / `updatePet` | CRUD |
| `deletePet` | Soft delete |
| `createPetTutorConvite` | Convidar por e-mail |
| `acceptPetTutorConvite(token)` | Aceitar |
| `revokePetTutorConvite` | Revogar pendente |

### Mutations staff

| Operação | Descrição |
| --- | --- |
| `createTutorAssisted` | Cadastro + e-mail senha |
| `createPetForTutor` | Pet para tutor localizado |
| `updatePetObsInternas` | Só chave do petshop_id atual |
| `updatePetObsCompartilhadas` | Staff |

## Frontend

### web-tutor

- `/pets` — lista
- `/pets/novo`, `/pets/:id/editar` — formulário com selects do catálogo global
- `/pets/:id` — detalhe, convite segundo tutor, exclusão com confirmação
- `/convites/aceitar?token=` — fluxo aceite

### web-petshop

- `/clientes/buscar` — busca CPF/e-mail
- `/clientes/novo` — cadastro assistido tutor
- `/clientes/:tutorId/pets/novo` — cadastro pet
- Observações no detalhe do pet (contexto agendamento — E07)

## Fora do escopo

- WhatsApp para link de senha
- Limite de tutores autorizados por pet (sem limite explícito no PRD)

## Critérios de aceite

- [ ] CA TUT-01, PET-01, PET-02, PET-03
- [ ] Limite 30 pets por tutor responsável
- [ ] Pet shop A não vê obs_internas do pet shop B
- [ ] Convite expirado não aceita
- [ ] Atendente cadastra tutor; tutor recebe e-mail para definir senha
- [ ] Busca tutor existente por CPF sem criar duplicata

## Histórias sugeridas

1. Serviço de pets + validação limite 30
2. obs_internas com isolamento por tenant
3. Fluxo PetTutorConvite completo
4. createTutorAssisted + integração Firebase reset link
5. UI tutor: CRUD pets + convites
6. UI petshop: busca + cadastro assistido
7. Testes: unicidade CPF, soft delete

## Definição de pronto

Tutores e pets geridos em ambos os fronts; compartilhamento funcional; cadastro assistido com e-mail de senha.
