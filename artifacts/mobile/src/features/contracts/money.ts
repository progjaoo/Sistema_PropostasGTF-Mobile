export function moneyToCents(value: string): number {
  const sanitized = value.replace(/[^\d,.-]/g, '').trim();
  if (!sanitized) throw new Error('Valor monetário inválido');
  const normalized = sanitized.includes(',') ? sanitized.replace(/\./g, '').replace(',', '.') : sanitized;
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor monetário inválido');
  return Math.round(amount * 100);
}

export function formatCents(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) throw new Error('Centavos inválidos');
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
}
