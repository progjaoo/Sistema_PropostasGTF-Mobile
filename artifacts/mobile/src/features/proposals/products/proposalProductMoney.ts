import type { ProposalProduct } from '@/src/types';

export function parseQuantity(value: string | number | null | undefined): number {
  const parsed = Number.parseInt(String(value ?? '').replace(/\D/g, ''), 10);
  if (!Number.isFinite(parsed)) return 1;
  return Math.min(9999, Math.max(1, parsed));
}

export function parseMoneyCents(value: string | number | null | undefined): number {
  const raw = String(value ?? '').trim().replace(/R\$\s?/gi, '').replace(/\s/g, '');
  if (!raw) return 0;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

export function formatMoneyInput(value: string | number | null | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return (Number.parseInt(digits, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function productSubtotalCents(product: Pick<ProposalProduct, 'qty' | 'unitValue'>): number {
  return parseQuantity(product.qty) * parseMoneyCents(product.unitValue);
}

export function proposalProductTotals(products: Array<Pick<ProposalProduct, 'qty' | 'unitValue'>>, investValue: string | null | undefined) {
  const productTotalCents = products.reduce((sum, product) => sum + productSubtotalCents(product), 0);
  const finalInvestmentCents = parseMoneyCents(investValue);
  const differenceCents = finalInvestmentCents - productTotalCents;
  return {
    productTotalCents,
    finalInvestmentCents,
    differenceCents,
    differencePercent: productTotalCents ? Math.round(Math.abs(differenceCents / productTotalCents * 100) * 100) / 100 : 0,
  };
}

export function formatCentsBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
