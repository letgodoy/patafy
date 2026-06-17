# E01 — Autenticação, Identidade e RBAC

| Campo | Valor |
| --- | --- |
| **ID** | E01 |
| **Fase** | MVP |
| **Dependências** | E00 |
| **Apps** | `api`, `web-tutor`, `web-petshop`, `web-admin` |
| **Rastreabilidade** | RF01, RF03.2–3.3, RF05; RNF03; ADR-002, ADR-004; CA TUT-01, TUT-02 |

## Objetivo

Integrar Firebase Authentication, sincronizar identidade na BD, gerir perfis (`TutorProfile`, `PetshopUserProfile`) e aplicar autorização por role no GraphQL — com CPF obrigatório para todos os perfis.

## Decisões aplicáveis

- **Login MVP:** e-mail/senha + Google. **Telefone fora do MVP** — não implementar fluxo telefone; deixar comentário/TODO no código para evolução.
- **CPF obrigatório** para tutor, owner, atendente e banhista (`User.cpf` NOT NULL após cadastro completo).

## Entidades

`User`, `TutorProfile`, `PetshopUserProfile`

## Regras de negócio

1. Firebase Auth é o IdP; API valida JWT (`aud`, `iss`, expiração).
2. Primeiro login bem-sucedido → `Mutation.syncUser` faz upsert de `User` por `firebase_uid`.
3. CPF único no sistema (`User.cpf` UNIQUE).
4. E-mail único (`User.email` UNIQUE).
5. 1 `User` → 0..1 `TutorProfile` e 0..N `PetshopUserProfile`.
6. Roles em `PetshopUserProfile.roles[]`: `owner`, `atendente`, `banhista` — acumuláveis.
7. `system_admin`: custom claim Firebase `system_admin: true` **ou** flag na BD — escolher uma abordagem e documentar; mutations de admin protegidas.
8. Operações B2B exigem `petshop_id` coerente com perfil do utilizador autenticado.
9. Tutor não tem `petshop_id`; dados B2C isolados por `tutor_profile_id`.
10. Erros GraphQL com `extensions.code` (ex.: `UNAUTHENTICATED`, `FORBIDDEN`, `CPF_DUPLICATE`, `EMAIL_DUPLICATE`).

## API GraphQL (módulo `auth` / `users`)

### Queries

| Operação | Quem | Descrição |
| --- | --- | --- |
| `me` | Autenticado | User + tutorProfile + petshopProfiles + roles |

### Mutations

| Operação | Quem | Descrição |
| --- | --- | --- |
| `syncUser` | Autenticado | Upsert pós-login Firebase |
| `registerTutor` | Público/autenticado | Cria User + TutorProfile (cadastro tutor) |
| `createPetshopStaff` | Owner / system_admin | Cria User + PetshopUserProfile com roles |
| `updateMyProfile` | Autenticado | Nome, telefone (CPF imutável após cadastro) |

### Context Yoga

```typescript
{
  prisma,
  firebaseUser,
  user,              // User da BD
  tutorProfile,
  petshopProfiles,
  activePetshopId,   // header ou claim para B2B
  isSystemAdmin,
}
```

### Plugin de autorização

- Decorator ou helper `requireRole(roles)` / `requireSystemAdmin()`
- Matriz mínima (expandir nos épicos):

| Capacidade | Tutor | Atendente | Banhista | Owner | system_admin |
| --- | --- | --- | --- | --- | --- |
| `me` | ✓ | ✓ | ✓ | ✓ | ✓ |
| Catálogo global write | — | — | — | — | ✓ |
| Operações petshop_id próprio | — | ✓ | ✓ | ✓ | — |

## Frontend

### web-tutor

- `/cadastro` — nome, CPF, e-mail, telefone, endereço, senha
- `/login` — e-mail/senha + botão Google
- Firebase SDK; token em `Authorization: Bearer` em todas as requests GraphQL
- Redirect pós-login → `/dashboard`
- Validação: CPF formato + unicidade (erro do servidor)
- CA TUT-01, TUT-02

### web-petshop

- `/login` — mesmo Firebase; após login verificar `petshopProfiles.length > 0`
- Se sem perfil B2B → mensagem "sem acesso"
- Guard de rota por role (owner/atendente/banhista)

### web-admin

- `/login` — Firebase; exigir `system_admin`
- Guard: sem claim → acesso negado

## Segurança

- Rate limiting por IP na API (plugin Fastify)
- Não logar CPF completo (mascarar)
- CORS: três origens em produção

## Fora do escopo

- Login por telefone
- MFA
- Recuperação de senha custom (usar fluxo Firebase padrão)

## Critérios de aceite

- [ ] Tutor cria conta com campos obrigatórios incluindo CPF
- [ ] Campos vazios → mensagens de erro
- [ ] E-mail ou CPF duplicado → erro claro
- [ ] Login e-mail/senha e Google funcionam nas 3 apps aplicáveis
- [ ] Credenciais inválidas → erro
- [ ] Sessão persiste até logout
- [ ] Staff criado com CPF obrigatório
- [ ] Mutations B2B bloqueadas sem role adequada
- [ ] `web-admin` bloqueia não-admins

## Histórias sugeridas

1. Plugin Fastify: validação JWT Firebase
2. Context Yoga + `me` + `syncUser`
3. `registerTutor` com validação CPF/e-mail
4. RBAC helpers + testes unitários
5. UI cadastro/login tutor
6. UI login petshop + admin com guards
7. Testes integração: token inválido → 401

## Definição de pronto

Utilizador consegue registar-se como tutor, fazer login nas três apps conforme perfil, e API rejeita operações não autorizadas com códigos estáveis.
