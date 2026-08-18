import { getContextBoardFilters } from '../useContextualProposalBoard';

describe('contextual proposal board filters', () => {
  it('envia stationId somente no contexto Empresa', () => {
    expect(getContextBoardFilters('station', { stationId: 's1', programId: 'p1' }, {})).toEqual({ stationId: 's1' });
  });

  it('envia programId somente no contexto Programa', () => {
    expect(getContextBoardFilters('program', { stationId: 's1', programId: 'p1' }, { status: 'SENT' })).toEqual({ programId: 'p1', status: 'SENT' });
  });

  it('não envia sem-programa como ID real para a API', () => {
    expect(getContextBoardFilters('program', { programId: 'sem-programa' }, {})).toEqual({});
  });
});
