import type { ProposalProduct } from '@/src/types';

type SuggestibleProduct = ProposalProduct & {
  suggestedValueMin?: string | null;
  suggestedValueMax?: string | null;
};

function money(value?: string | null): number | null {
  if (!value) return null;
  const clean = value.replace(/[^\d,.-]/g, '');
  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');
  const normalized = hasComma && hasDot
    ? clean.replace(/\./g, '').replace(',', '.')
    : hasComma
      ? clean.replace(',', '.')
      : clean;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function calculateInvestmentSuggestion(products: SuggestibleProduct[]): number {
  return products.reduce((total, product) => {
    if (!product.productTemplateId) return total;
    const min = money(product.suggestedValueMin);
    const max = money(product.suggestedValueMax);
    const reference = min !== null && max !== null ? (min + max) / 2 : min ?? max;
    if (reference === null) return total;
    const quantity = Number.parseInt(product.qty || '1', 10);
    return total + reference * (Number.isFinite(quantity) ? quantity : 1);
  }, 0);
}
