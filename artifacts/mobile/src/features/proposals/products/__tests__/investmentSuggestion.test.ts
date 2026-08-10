import { calculateInvestmentSuggestion } from '../investmentSuggestion';

describe('investment suggestion', () => {
  it('uses catalog values and ignores free products', () => {
    expect(
      calculateInvestmentSuggestion([
        { id: '1', order: 0, qty: '2', title: 'Spot', color: 'BLUE', productTemplateId: 'p1', suggestedValueMin: '100,00', suggestedValueMax: '200,00' },
        { id: '2', order: 1, qty: '5', title: 'Avulso', color: 'BLUE' },
      ]),
    ).toBe(300);
  });

  it('accepts decimal values returned by PostgreSQL', () => {
    expect(
      calculateInvestmentSuggestion([
        { id: '1', order: 0, qty: '2', title: 'Spot', color: 'BLUE', productTemplateId: 'p1', suggestedValueMin: '1500.00' },
      ]),
    ).toBe(3000);
  });

  it('uses the available endpoint when only one suggested value exists', () => {
    expect(
      calculateInvestmentSuggestion([
        { id: '1', order: 0, qty: '3', title: 'Spot', color: 'BLUE', productTemplateId: 'p1', suggestedValueMax: '250,00' },
      ]),
    ).toBe(750);
  });
});
