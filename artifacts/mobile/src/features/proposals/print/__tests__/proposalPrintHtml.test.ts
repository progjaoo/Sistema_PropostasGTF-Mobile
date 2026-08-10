import type { Proposal, ProposalProduct } from '@/src/types';
import { proposalPrintHtml } from '../proposalPrintHtml';

function product(index: number): ProposalProduct {
  return {
    id: `product-${index}`,
    order: index,
    qty: '01',
    title: `Produto ${index}`,
    color: 'BLUE',
  };
}

function proposal(products: ProposalProduct[]): Proposal {
  return {
    id: 'proposal-1',
    stationId: 'station-1',
    createdById: 'user-1',
    status: 'DRAFT',
    propType: 'Comercial',
    propMonth: 'Julho',
    propYear: '2026',
    showPeriod: false,
    overlayOpacity: 0,
    stats: [],
    products,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
  };
}

describe('proposalPrintHtml', () => {
  it('paginates five products and keeps financial data on the last page', () => {
    const html = proposalPrintHtml(proposal(Array.from({ length: 5 }, (_, index) => product(index + 1))));

    expect(html.match(/<main class="page/g)).toHaveLength(2);
    expect(html.match(/class="investment"/g)).toHaveLength(1);
    expect(html.match(/<footer>/g)).toHaveLength(1);
    expect(html).toContain('Plano de Ações - continuacao');
    expect(html).toContain('break-inside: avoid');
    expect(html).toContain('font-family: Montserrat');
    expect(html).toContain('border-left-color:#427EFF');
  });

  it('prints period note when period is visible', () => {
    const base = proposal([product(1)]);
    const html = proposalPrintHtml({
      ...base,
      showPeriod: true,
      dateStart: '2026-08-01',
      periodDesc: 'Veiculacao de segunda a sexta.',
    });

    expect(html).toContain('Veiculacao de segunda a sexta.');
    expect(html).toContain('period-note');
  });
});
