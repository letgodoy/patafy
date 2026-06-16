# E12 — PWA, Performance e Polish Transversal

| Campo | Valor |
| --- | --- |
| **ID** | E12 |
| **Fase** | MVP (finalização) |
| **Dependências** | E01–E11 (features principais implementadas) |
| **Apps** | `web-tutor`, `web-petshop`, `web-admin`, `api` |
| **Rastreabilidade** | RNF01, RNF02; Arquitetura §Desempenho |

## Objetivo

Entregar experiência **mobile-first** instalável (PWA), performance dentro do orçamento (telas < 3s, Core Web Vitals verdes) e polish de UX transversal nas três SPAs.

## Escopo

### PWA (RNF01)

Para cada SPA (`web-tutor`, `web-petshop`, `web-admin`):

- `manifest.webmanifest` completo: name, short_name, theme_color, background_color, ícones 192/512
- Service worker (Vite PWA plugin): precache assets estáticos; network-first para API
- Meta tags mobile: viewport, apple-touch-icon
- Lighthouse PWA audit pass

### Performance front (RNF02)

- Lazy loading de rotas (`React.lazy` + Suspense)
- Skeleton loaders em listas (agendamentos, pets, lojas)
- Imagens: logo loja com lazy load + dimensões fixas
- Bundle analysis; code split por rota
- Meta: LCP < 2.5s, INP < 200ms, CLS < 0.1 em páginas críticas (home tutor, agenda petshop)

### Performance API

- **DataLoader** em resolvers GraphQL com relações frequentes (pet, servico, banhista)
- Limites Yoga: profundidade max 7, complexidade max configurável
- Paginação obrigatória em listas grandes (`agendaPetShop`, `myAgendamentos`, `listPetShops`)
- Cache TTL catálogo global (reforço E02)
- Índices BD revisados com `EXPLAIN` nas queries de relatório e agenda

### UX transversal

- Tratamento de erros GraphQL → toasts/mensagens por `extensions.code`
- Estados vazios ilustrados (sem pets, sem agendamentos, sem lojas)
- Confirmação em ações destrutivas (cancelar, excluir pet)
- Loading global em mutations
- Tema `cor_principal` da loja no `web-tutor` ao navegar `/loja/:slug` (CSS variables)
- Acessibilidade básica: labels em formulários, foco em modais, contraste WCAG AA

### Segurança reforço

- Rate limiting API (reforço E01)
- HSTS no edge (documentar deploy)
- Sanitização HTML em templates e-mail (E09)

### Preparação geolocalização (sem UI)

- Documentar em código/API o argumento futuro `listPetShops(near: NearInput)` comentado no schema GraphQL
- `PetShop.latitude`/`longitude` editáveis no `web-admin` (opcional, campos ocultos no MVP tutor)

## Fora do escopo

- i18n multi-idioma
- Dark mode completo (opcional nice-to-have)
- Offline-first com sync de agendamentos

## Critérios de aceite

- [ ] Três apps instaláveis como PWA em Android/iOS
- [ ] Lighthouse Performance ≥ 80 e PWA pass nas rotas principais
- [ ] Telas críticas carregam em < 3s em rede 4G simulada
- [ ] Listas paginadas não carregam dataset completo
- [ ] Erros de rede exibem mensagem amigável
- [ ] Tema cor da loja aplicado na página do slug

## Histórias sugeridas

1. Vite PWA plugin nas 3 apps
2. Lazy routes + skeletons
3. DataLoader nos resolvers principais
4. Limites complexidade GraphQL
5. Error boundary + toast mapping
6. Tema dinâmico por loja
7. Lighthouse CI (opcional) com thresholds
8. A11y pass em formulários críticos

## Definição de pronto

Produto MVP polido, instalável e dentro das metas de performance definidas no PRD.
