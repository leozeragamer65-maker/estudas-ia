// Telefone → email "virtual" para usar o Auth gerido sem precisar de SMS.
// O telefone real é guardado no perfil. Esta é a substituição declarada no plano.
export function phoneToEmail(telefone: string): string {
  const limpo = telefone.replace(/\D+/g, "");
  return `tel-${limpo}@estudaia.app`;
}

export function normalizarTelefone(telefone: string): string {
  return telefone.replace(/\D+/g, "");
}

export function telefoneValido(telefone: string): boolean {
  const t = normalizarTelefone(telefone);
  return t.length >= 9 && t.length <= 15;
}
