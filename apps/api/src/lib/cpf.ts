export function validarCPF(cpf: string): boolean {
  const n = cpf.replace(/\D/g, '')
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += Number(n[i]) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto >= 10) resto = 0
  if (resto !== Number(n[9])) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += Number(n[i]) * (11 - i)
  resto = (soma * 10) % 11
  if (resto >= 10) resto = 0
  return resto === Number(n[10])
}

export function normalizarCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

export function mascararCPF(cpf: string): string {
  return cpf.replace(/(\d{3})\d{3}(\d{3})(\d{2})/, '$1.***.***-$3')
}
