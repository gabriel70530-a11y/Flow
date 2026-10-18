export const MIN_AGE = 13;

// Só o ano é pedido: quem faz 18 neste ano ainda pode ser menor, então conta como menor até o ano seguinte.
export function isMinor(birthYear: number, currentYear: number): boolean {
  return currentYear - birthYear <= 18;
}

export function validateBirthYear(value: string, currentYear: number): string | null {
  const year = Number(value);
  if (!/^\d{4}$/.test(value.trim()) || year < currentYear - 100 || year > currentYear) return "Digite o ano com 4 números, como 2008.";
  if (currentYear - year < MIN_AGE) return `O Flow é para quem faz ${MIN_AGE} anos ou mais neste ano.`;
  return null;
}
