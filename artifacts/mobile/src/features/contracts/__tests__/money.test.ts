import { formatCents, moneyToCents } from '../money';

describe('contract money helpers', () => {
  it('converts Brazilian input to integer cents', () => {
    expect(moneyToCents('R$ 2.000,50')).toBe(200050);
    expect(formatCents(200050)).toBe('2000.50');
    expect(() => moneyToCents('valor inválido')).toThrow('Valor monetário inválido');
  });
});
