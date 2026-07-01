type EmailPayload = {
  agendamento_id: string
  pet_nome: string
  petshop_nome: string
  data_hora_inicio: string
  servicos_resumo: string[]
  endereco_loja: string | null
  link_agendamento: string
}

function formatDataHora(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
}

function baseLayout(titulo: string, conteudo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title>
<style>
  body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}
  .wrap{max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
  .header{background:#22c55e;padding:24px 32px;color:#fff}
  .header h1{margin:0;font-size:22px}
  .body{padding:32px}
  .info{background:#f9fafb;border-radius:6px;padding:16px;margin:16px 0}
  .info p{margin:4px 0;font-size:14px;color:#374151}
  .btn{display:inline-block;background:#22c55e;color:#fff!important;text-decoration:none;padding:12px 24px;border-radius:6px;font-weight:bold;margin-top:20px}
  .footer{padding:16px 32px;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>Patafy Care 🐾</h1></div>
  <div class="body">${conteudo}</div>
  <div class="footer">Patafy Care — cuidando do seu pet com carinho</div>
</div>
</body>
</html>`
}

export function templateAgendado(p: EmailPayload) {
  const servicos = p.servicos_resumo.join(', ')
  return {
    subject: `Banho solicitado — ${p.petshop_nome}`,
    html: baseLayout('Banho solicitado', `
      <h2 style="color:#374151;margin-top:0">Seu agendamento foi solicitado!</h2>
      <p>Olá! O banho do <strong>${p.pet_nome}</strong> foi solicitado com sucesso e aguarda confirmação da loja.</p>
      <div class="info">
        <p><strong>Pet:</strong> ${p.pet_nome}</p>
        <p><strong>Loja:</strong> ${p.petshop_nome}</p>
        <p><strong>Data e hora:</strong> ${formatDataHora(p.data_hora_inicio)}</p>
        <p><strong>Serviços:</strong> ${servicos}</p>
        ${p.endereco_loja ? `<p><strong>Endereço:</strong> ${p.endereco_loja}</p>` : ''}
      </div>
      <p style="font-size:13px;color:#6b7280">Você receberá uma confirmação assim que a loja aprovar.</p>
      <a href="${p.link_agendamento}" class="btn">Ver Agendamentos</a>
    `),
    text: `Banho solicitado!\n\nPet: ${p.pet_nome}\nLoja: ${p.petshop_nome}\nData: ${formatDataHora(p.data_hora_inicio)}\nServiços: ${servicos}\n\nAcesse: ${p.link_agendamento}`,
  }
}

export function templateConfirmado(p: EmailPayload) {
  const servicos = p.servicos_resumo.join(', ')
  return {
    subject: `Banho confirmado — ${formatDataHora(p.data_hora_inicio)}`,
    html: baseLayout('Banho confirmado', `
      <h2 style="color:#16a34a;margin-top:0">Seu banho está confirmado! ✅</h2>
      <p><strong>${p.petshop_nome}</strong> confirmou o agendamento do <strong>${p.pet_nome}</strong>.</p>
      <div class="info">
        <p><strong>Pet:</strong> ${p.pet_nome}</p>
        <p><strong>Loja:</strong> ${p.petshop_nome}</p>
        <p><strong>Data e hora:</strong> ${formatDataHora(p.data_hora_inicio)}</p>
        <p><strong>Serviços:</strong> ${servicos}</p>
        ${p.endereco_loja ? `<p><strong>Endereço:</strong> ${p.endereco_loja}</p>` : ''}
      </div>
      <a href="${p.link_agendamento}" class="btn">Ver Agendamentos</a>
    `),
    text: `Banho confirmado!\n\nPet: ${p.pet_nome}\nLoja: ${p.petshop_nome}\nData: ${formatDataHora(p.data_hora_inicio)}\nServiços: ${servicos}\n\nAcesse: ${p.link_agendamento}`,
  }
}

export function templateCancelado(p: EmailPayload) {
  return {
    subject: `Agendamento cancelado — ${p.petshop_nome}`,
    html: baseLayout('Agendamento cancelado', `
      <h2 style="color:#dc2626;margin-top:0">Agendamento cancelado</h2>
      <p>O agendamento do <strong>${p.pet_nome}</strong> em <strong>${p.petshop_nome}</strong> foi cancelado.</p>
      <div class="info">
        <p><strong>Pet:</strong> ${p.pet_nome}</p>
        <p><strong>Loja:</strong> ${p.petshop_nome}</p>
        <p><strong>Data prevista:</strong> ${formatDataHora(p.data_hora_inicio)}</p>
      </div>
      <p style="font-size:13px;color:#6b7280">Se precisar, você pode fazer um novo agendamento.</p>
      <a href="${p.link_agendamento}" class="btn">Ver Agendamentos</a>
    `),
    text: `Agendamento cancelado.\n\nPet: ${p.pet_nome}\nLoja: ${p.petshop_nome}\nData prevista: ${formatDataHora(p.data_hora_inicio)}\n\nAcesse: ${p.link_agendamento}`,
  }
}

export function templateAlterado(p: EmailPayload) {
  const servicos = p.servicos_resumo.join(', ')
  return {
    subject: `Agendamento alterado — nova data ${formatDataHora(p.data_hora_inicio)}`,
    html: baseLayout('Agendamento alterado', `
      <h2 style="color:#d97706;margin-top:0">Seu agendamento foi alterado</h2>
      <p>O agendamento do <strong>${p.pet_nome}</strong> foi remarcado.</p>
      <div class="info">
        <p><strong>Pet:</strong> ${p.pet_nome}</p>
        <p><strong>Loja:</strong> ${p.petshop_nome}</p>
        <p><strong>Nova data e hora:</strong> ${formatDataHora(p.data_hora_inicio)}</p>
        <p><strong>Serviços:</strong> ${servicos}</p>
        ${p.endereco_loja ? `<p><strong>Endereço:</strong> ${p.endereco_loja}</p>` : ''}
      </div>
      <a href="${p.link_agendamento}" class="btn">Ver Agendamentos</a>
    `),
    text: `Agendamento alterado!\n\nPet: ${p.pet_nome}\nLoja: ${p.petshop_nome}\nNova data: ${formatDataHora(p.data_hora_inicio)}\nServiços: ${servicos}\n\nAcesse: ${p.link_agendamento}`,
  }
}
