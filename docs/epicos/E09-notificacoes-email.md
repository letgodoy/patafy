# E09 — Notificações Transacionais (E-mail via Resend)

| Campo | Valor |
| --- | --- |
| **ID** | E09 |
| **Fase** | MVP |
| **Dependências** | E07 (eventos de agendamento) |
| **Apps** | `api`, `worker` |
| **Rastreabilidade** | RF10; CA NOT-01; ADR-003 |

## Objetivo

Enviar e-mails transacionais nos 4 eventos do MVP usando padrão **outbox** + worker com **Resend**.

## Decisão aplicável

- Provedor: **Resend** (`RESEND_API_KEY`, domínio verificado em produção)

## Entidade

`NotificacaoOutbox`

## Eventos MVP (canal `email`)

| Tipo | Gatilho |
| --- | --- |
| `agendado` | Tutor cria agendamento (`AguardandoConfirmacao`) |
| `confirmado` | Staff confirma ou atendente cria já confirmado |
| `cancelado` | Cancelamento (`Cancelado`) |
| `alterado` | Remarcação ou mudança data/hora pelo staff |

### Não enviar e-mail

- Mudanças de status operacionais: `EmAndamento`, `Atrasado`, `Pronto`, `Finalizado`, `NaoCompareceu`
- Troca silenciosa de banhista (tutor não fixou preferência)
- RF09.2: tutor não recebe e-mail a cada mudança de status

## Regras

1. Inserir em `NotificacaoOutbox` na **mesma transação Prisma** que persiste a mudança do agendamento.
2. Campos: `user_id` (tutor), `canal: email`, `tipo`, `payload` jsonb, `status: pendente`, `data_envio` null até envio.
3. **Payload mínimo:** agendamento_id, pet_nome, petshop_nome, data_hora_inicio, servicos_resumo[], endereco_loja, link_agendamento (web-tutor).
4. Worker poll: `WHERE status = pendente ORDER BY created_at LIMIT N`.
5. Envio via Resend API.
6. Sucesso → `status = enviado`, `data_envio = now()`.
7. Falha → retry exponencial (ex.: 1m, 5m, 30m, 2h); após max tentativas → `status = falha`.
8. **Idempotência worker:** não reenviar se `status = enviado`; usar `id` da outbox como chave.
9. Atendente cria confirmado → enfileirar **dois** registos (`agendado` + `confirmado`) ou um único e-mail combinado — **decisão:** dois registos separados (mais simples para templates).

## Templates (HTML + texto plain)

Local: `apps/worker/templates/email/` ou `packages/email-templates/`

| Template | Assunto (ex.) |
| --- | --- |
| `agendado` | Seu banho foi solicitado — {{petshop}} |
| `confirmado` | Banho confirmado — {{data}} |
| `cancelado` | Agendamento cancelado |
| `alterado` | Seu agendamento foi alterado |

- Variáveis: data, horário, pet, loja, serviços, link para `/agendamentos/:id`
- Layout responsivo mobile-first
- `from`: `noreply@<dominio-verificado>` (configurável)

## Implementação worker

```typescript
// Pseudocódigo
while (true) {
  const batch = await prisma.notificacaoOutbox.findMany({ where: { status: 'pendente' }, take: 20 });
  for (const item of batch) {
    try {
      await resend.emails.send({ ... });
      await prisma.notificacaoOutbox.update({ where: { id }, data: { status: 'enviado', data_envio: new Date() } });
    } catch (e) {
      await handleRetry(item, e);
    }
  }
  await sleep(POLL_INTERVAL_MS);
}
```

## API (módulo `notificacoes`) — admin opcional

| Operação | Quem | Descrição |
| --- | --- | --- |
| `notificacaoOutboxList` | system_admin, owner | Debug / reprocessar |
| `retryNotificacao` | system_admin | Reenfileirar `falha` → `pendente` |

## Variáveis de ambiente

```
RESEND_API_KEY=
EMAIL_FROM=noreply@patafy.care
EMAIL_FROM_NAME=Patafy Care
```

## Dev / testes

- Modo sandbox: `EMAIL_DRY_RUN=true` loga payload sem enviar
- Testes integração: mock Resend client

## Fora do escopo

- Push FCM (NOT-02)
- Lembretes antes do banho (NOT-03)
- SMS / WhatsApp
- E-mail "pet pronto"

## Critérios de aceite

- [ ] CA NOT-01 completo
- [ ] 4 eventos disparam e-mail com data, horário, pet shop, pet, serviços
- [ ] Falha Resend não perde intent (outbox persiste)
- [ ] Retry funciona; estado `falha` após esgotar tentativas
- [ ] Troca silenciosa banhista não gera e-mail
- [ ] Dry-run em dev documentado

## Histórias sugeridas

1. Serviço enqueueOutbox (chamado por E07)
2. Templates HTML 4 eventos
3. Worker Resend + retry
4. Testes unitários payload builder
5. Testes integração dry-run
6. UI admin opcional: lista outbox falhas

## Definição de pronto

Tutor recebe e-mails nos 4 eventos; falhas rastreáveis na outbox; Resend configurado.
