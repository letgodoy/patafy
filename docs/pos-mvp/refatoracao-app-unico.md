# Proposta: Unificação para App Único com Roles

## Contexto

Atualmente o projeto tem 3 apps separados (`web-petshop`, `web-tutor`, `web-admin`), cada um com seu próprio build, URL e autenticação. A proposta é consolidar tudo em **um único app** (`apps/web`) com roteamento baseado em roles.

---

## Roles e Níveis de Acesso

| Role | Quem é | Como acessa |
|---|---|---|
| `admin` | Equipe Patafy | Convidado manualmente; Firebase Custom Claim `system_admin: true` |
| `petshop` | Dono/staff de petshop | Cadastrado pelo admin ou pelo próprio owner; tem registro em `petshop_user_profiles` |
| `tutor` | Dono de pet | Auto-cadastro livre, sem aprovação |

---

## Detecção de Role (sem alteração no backend)

O endpoint GraphQL já existente `me { petshopProfiles { id } }` + a Custom Claim do Firebase são suficientes:

```
1. Firebase onAuthStateChanged → usuário autenticado
2. Lê Custom Claim via getIdTokenResult()
   └─ system_admin: true → role = 'admin'
3. Se não admin → chama { me { petshopProfiles { id } } }
   ├─ me = null      → role = 'unregistered' (vai para /cadastro)
   ├─ petshopProfiles.length > 0 → role = 'petshop'
   └─ petshopProfiles.length = 0 → role = 'tutor'
```

Nenhuma alteração na API é necessária.

---

## Estrutura do Novo App

```
apps/web/
  src/
    lib/
      firebase.ts             ← cópia de web-tutor
      graphql-client.ts       ← cópia de web-tutor
    contexts/
      AuthContext.tsx          ← NOVO (unificado, detecta role)
    components/
      ProtectedRoute.tsx       ← role-aware
      AdminLayout.tsx          ← wrapper do AdminLayout do @patafy/ui
      PetshopLayout.tsx        ← wrapper do AdminLayout com nav do petshop
      TutorLayout.tsx          ← top nav (já existe no web-tutor)
    pages/
      LoginPage.tsx            ← NOVO (único login para todos)
      CadastroPage.tsx         ← cópia de web-tutor (auto-cadastro de tutores)
      admin/
        DashboardPage.tsx
        AdminsPage.tsx
        AuditoriaPage.tsx
        catalogo/
          TiposPage.tsx
          RacasPage.tsx
          PortesPage.tsx
          PelagensPage.tsx
        petshops/
          PetShopsPage.tsx
      petshop/
        DashboardPage.tsx
        BloqueiosPage.tsx
        ConfiguracoesPage.tsx
        EquipePage.tsx
        SemAcessoPage.tsx
        agenda/
          AgendaPage.tsx
          MinhaAgendaPage.tsx
          AtendimentoDetalhe.tsx
          AgendamentoCard.tsx
        auditoria/
          AuditoriaPetshopPage.tsx
          RegistroTimeline.tsx
        clientes/
          BuscarClientePage.tsx
          NovoClientePage.tsx
          NovoPetClientePage.tsx
        pacotes/
          PacotesPage.tsx
          VenderPacotePage.tsx
        relatorios/
          RelatoriosPage.tsx
        servicos/
          CategoriasPage.tsx
          ServicosPage.tsx
      tutor/
        DashboardPage.tsx
        LojasPage.tsx
        LojaPage.tsx
        PetsPage.tsx
        PetFormPage.tsx
        PetDetailPage.tsx
        PetPacotesPage.tsx
        AceitarConvitePage.tsx
        agendamentos/
          AgendamentosPage.tsx
          AgendarPage.tsx
          steps/
            StepBanhista.tsx
            StepData.tsx
            StepPet.tsx
            StepResumo.tsx
            StepServicos.tsx
            StepSlot.tsx
        servicos/
          LojaServicosPage.tsx
    App.tsx                    ← NOVO (roteamento unificado)
    main.tsx                   ← NOVO
  index.html
  vite.config.ts
  tsconfig.json
  package.json
```

---

## Roteamento Unificado (App.tsx)

```
/ → RoleRedirect
  ├─ role=null    → /login
  ├─ role=admin   → /admin/dashboard
  ├─ role=petshop → /petshop/dashboard
  └─ role=tutor   → /tutor/dashboard

/login       → LoginPage (público)
/cadastro    → CadastroPage (público, auto-registro de tutores)

/admin/*     → AdminLayout  + ProtectedRoute(role='admin')
  /admin/dashboard
  /admin/petshops
  /admin/admins
  /admin/auditoria
  /admin/catalogo/tipos
  /admin/catalogo/racas
  /admin/catalogo/portes
  /admin/catalogo/pelagens

/petshop/*   → PetshopLayout + ProtectedRoute(role='petshop')
  /petshop/dashboard
  /petshop/agenda
  /petshop/minha-agenda
  /petshop/clientes/buscar
  /petshop/servicos
  /petshop/pacotes
  /petshop/relatorios
  /petshop/configuracoes
  /petshop/equipe
  /petshop/bloqueios
  /petshop/auditoria

/tutor/*     → TutorLayout  + ProtectedRoute(role='tutor')
  /tutor/dashboard
  /tutor/lojas
  /tutor/loja/:slug
  /tutor/pets
  /tutor/agendamentos
  /tutor/convites/aceitar
  ...
```

---

## Impacto nas Pages Existentes

A grande maioria das páginas **não precisa de alteração** — elas importam só de `@patafy/graphql-client` e `@patafy/ui` (caminhos absolutos, sem mudança).

As únicas mudanças de import ocorrem em arquivos que importam `AuthContext` via caminho relativo:

| Arquivo | Antes | Depois |
|---|---|---|
| `petshop/DashboardPage.tsx` | `'../contexts/AuthContext.js'` | `'../../contexts/AuthContext.js'` |
| `petshop/SemAcessoPage.tsx` | `'../contexts/AuthContext.js'` | `'../../contexts/AuthContext.js'` |
| `admin/DashboardPage.tsx` | `'../contexts/AuthContext.js'` | `'../../contexts/AuthContext.js'` |
| `admin/AcessoNegadoPage.tsx` | `'../contexts/AuthContext.js'` | `'../../contexts/AuthContext.js'` |
| `tutor/DashboardPage.tsx` | `'../contexts/AuthContext.js'` | `'../../contexts/AuthContext.js'` |
| `CadastroPage.tsx` | `'../contexts/AuthContext.js'` | `'../contexts/AuthContext.js'` ✓ (mantém) |

**Total: 5 arquivos com ajuste de import.**

---

## Autenticação Unificada — LoginPage

O login passa a ser único para todos os perfis. Após autenticar no Firebase, o sistema detecta o role e redireciona automaticamente:

- Admin → `/admin/dashboard`
- Petshop → `/petshop/dashboard`
- Tutor novo → `/cadastro` (completa registro)
- Tutor existente → `/tutor/dashboard`

A LoginPage mantém o design split-screen já implementado, com copy genérico: "Bem-vindo ao Patafy".

---

## O que Muda para o Tutor (Self-Service)

O tutor **continua sem necessidade de cadastro prévio**:
1. Acessa a URL única do Patafy
2. Clica em "Cadastre-se" na LoginPage
3. CadastroPage: cria conta Firebase + preenche CPF/nome → chama `registerTutor`
4. Redireciona para `/tutor/dashboard`

O fluxo do Google Sign-In:
1. Autentica com Google
2. Se `me` retorna null → redireciona para `/cadastro` para completar CPF/nome
3. Após completar → role=tutor, segue normalmente

---

## Passos de Implementação

### Fase 1 — Setup do novo app (15 min)
1. Criar `apps/web/` com `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
2. Copiar `lib/firebase.ts` e `lib/graphql-client.ts`
3. Criar `AuthContext.tsx` unificado com detecção de role
4. Criar `ProtectedRoute.tsx` role-aware
5. Criar `LoginPage.tsx` unificada

### Fase 2 — Layouts (10 min)
6. Criar `AdminLayout.tsx`, `PetshopLayout.tsx`, `TutorLayout.tsx` em `components/`

### Fase 3 — Migração de pages (20 min via Bash cp)
7. Copiar pages de web-admin → `src/pages/admin/`
8. Copiar pages de web-petshop → `src/pages/petshop/`
9. Copiar pages de web-tutor → `src/pages/tutor/`
10. Corrigir 5 imports de AuthContext

### Fase 4 — Roteamento (10 min)
11. Criar `App.tsx` com roteamento completo
12. Criar `main.tsx`

### Fase 5 — Validação
13. Rodar `tsc --noEmit` no novo app
14. Subir dev server e testar os 3 fluxos (admin, petshop, tutor)

---

## O que Acontece com os 3 Apps Antigos

Os apps `web-petshop`, `web-tutor`, `web-admin` **não são deletados** nesta refatoração. Ficam como estão até o novo app estar validado em produção. Quando o novo app subir, os 3 antigos são removidos em um PR de limpeza.

---

## Riscos e Considerações

| Risco | Mitigação |
|---|---|
| Usuário abre a URL do petshop diretamente | O novo `/petshop/*` tem `ProtectedRoute(role='petshop')` — tutor é redirecionado para `/tutor/dashboard` |
| Petshop owner tenta acessar área de tutor | Redirecionado para `/petshop/dashboard` automaticamente |
| `me` query falha (API offline) | AuthContext cai no catch, role permanece como 'tutor' por segurança; admin ainda pode entrar pela Custom Claim |
| Múltiplos tabs / race conditions | onAuthStateChanged é cancelado corretamente via cleanup function |

---

*Documento gerado para revisão antes da implementação.*
