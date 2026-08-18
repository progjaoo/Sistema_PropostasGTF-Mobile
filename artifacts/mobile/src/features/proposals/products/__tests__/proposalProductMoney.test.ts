import { formatMoneyInput, parseQuantity, productSubtotalCents, proposalProductTotals } from '../proposalProductMoney';

describe('proposal product money', () => {
  it('normalizes quantity between one and 9999', () => {
    expect(parseQuantity('0')).toBe(1);
    expect(parseQuantity('10000')).toBe(9999);
  });

  it('calculates item and investment totals with integer cents', () => {
    expect(productSubtotalCents({ qty: '03', unitValue: '1500.50' })).toBe(450150);
    expect(proposalProductTotals([{ qty: '02', unitValue: '100.00' }], '180.00')).toEqual({
      productTotalCents: 20000,
      finalInvestmentCents: 18000,
      differenceCents: -2000,
      differencePercent: 10,
    });
  });

  it('formats typed digits as BRL input', () => {
    expect(formatMoneyInput('150050')).toBe('1.500,50');
  });
});
