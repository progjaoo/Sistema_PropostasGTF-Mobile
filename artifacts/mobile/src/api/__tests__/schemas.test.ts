import {
  advertiserWithProposalsSchema,
  leadMetricsSchema,
  leadSourceSchema,
  proposalProductSchema,
  proposalProgramBoardSchema,
  proposalProgressBoardSchema,
} from '../schemas';

describe('mobile API contracts', () => {
  it('parses a progress board grouped by programs and commercial steps', () => {
    const result = proposalProgressBoardSchema.parse({
      programs: [
        {
          id: 'program-1',
          name: 'Jornal da Manha',
          stationId: null,
          proposals: [
            {
              id: 'proposal-1',
              status: 'SENT',
              currentStep: 'PROPOSAL_SENT',
              proposalTypeName: 'Pacote Promocional',
              createdByName: 'Carlos Silva',
              products: [],
            },
          ],
        },
      ],
    });

    expect(result.programs[0].proposals[0].currentStep).toBe('PROPOSAL_SENT');
  });

  it('normalizes nullable display fields in proposal boards', () => {
    const result = proposalProgressBoardSchema.parse({
      programs: [
        {
          id: 'sem-programa',
          name: 'Sem programa',
          proposals: [
            {
              id: 'proposal-legacy',
              status: 'DRAFT',
              currentStep: 'LEAD_CREATED',
              proposalTypeName: null,
              createdByName: null,
              products: [{ id: 'item-legacy', title: null, qty: null }],
            },
          ],
        },
      ],
    });

    expect(result.programs[0].proposals[0].proposalTypeName).toBe('Proposta comercial');
    expect(result.programs[0].proposals[0].createdByName).toBe('Sem responsavel');
    expect(result.programs[0].proposals[0].products[0].title).toBe('Produto sem nome');
    expect(result.programs[0].proposals[0].products[0].qty).toBe('01');
  });

  it('parses a program board with products, totals context and linked proposals', () => {
    const result = proposalProgramBoardSchema.parse({
      programs: [
        {
          id: 'program-1',
          name: 'Jornal da Manha',
          stationId: 'station-1',
          stationName: 'Radio 88 FM',
          primaryColor: '#427EFF',
          products: [{ id: 'product-1', title: 'Spot 30 segundos', suggestedValueMin: '1500.00' }],
          proposals: [
            {
              id: 'proposal-1',
              status: 'DRAFT',
              advertiserName: 'Cliente',
              proposalTypeName: 'Pacote',
              createdByName: 'Carlos',
              investValue: '1500.00',
              products: [{ id: 'item-1', title: 'Spot 30 segundos', qty: '01' }],
            },
          ],
        },
      ],
    });

    expect(result.programs[0].products[0].title).toBe('Spot 30 segundos');
    expect(result.programs[0].proposals[0].advertiserName).toBe('Cliente');
  });

  it('parses lead source data and metrics', () => {
    const source = leadSourceSchema.parse({
      id: 'source-1',
      name: 'Indicacao',
      slug: 'indicacao',
      active: true,
      order: 1,
    });
    const metrics = leadMetricsSchema.parse({
      totals: { captured: 12, open: 8, converted: 4, conversionRate: 33.33 },
      bySource: [{ leadSourceId: source.id, name: source.name, captured: 12, open: 8, converted: 4, conversionRate: 33.33 }],
    });

    expect(metrics.bySource[0].name).toBe('Indicacao');
  });

  it('parses proposal product commercial metadata', () => {
    const product = proposalProductSchema.parse({
      id: 'item-1',
      order: 1,
      qty: '2',
      title: 'Spot',
      color: 'BLUE',
      productTemplateId: 'product-1',
      durationLabel: '30s',
      airTime: '13h as 15h',
      seasonality: 'MONTHLY',
    });

    expect(product.durationLabel).toBe('30s');
    expect(product.seasonality).toBe('MONTHLY');
  });

  it('keeps restricted linked proposals redacted', () => {
    const advertiser = advertiserWithProposalsSchema.parse({
      id: 'advertiser-1',
      tradeName: 'Cliente',
      active: true,
      status: 'LEAD',
      createdAt: new Date().toISOString(),
      proposals: [
        {
          id: 'proposal-1',
          propType: null,
          investValue: null,
          status: 'DRAFT',
          programName: 'Jornal da Manha',
          createdById: 'user-1',
          createdByName: 'Carlos',
          viewerCanEdit: false,
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    expect(advertiser.proposals[0].viewerCanEdit).toBe(false);
    expect(advertiser.proposals[0].propType).toBeNull();
  });

  it('rejects malformed critical responses', () => {
    expect(() =>
      proposalProductSchema.parse({
        id: 'item-1',
        order: 'first',
        qty: '1',
        title: 'Spot',
      }),
    ).toThrow();
  });
});
