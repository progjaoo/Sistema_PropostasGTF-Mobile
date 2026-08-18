import type { ProposalProgressBoard } from '@/src/api/contracts';
import {
  buildProposalStageColumns,
  buildProposalSearchResults,
  countActiveProposalFilters,
  filterProposalBoardLocally,
  filterWithoutProgram,
  getFirstPopulatedStageIndex,
  isValidIsoBoardDate,
} from '../proposalBoardModel';

const progressBoardFixture: ProposalProgressBoard = {
  programs: [
    {
      id: 'program-1', name: 'Jornal', stationId: 'station-1', stationName: 'Mosaico',
      proposals: [{
        id: 'proposal-1', status: 'SENT', currentStep: 'PROPOSAL_SENT', viewerCanEdit: true,
        stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
        proposalTypeName: 'Patrocínio', advertiserName: 'Cliente A', createdByName: 'Ana',
        updatedAt: '2026-08-18T12:00:00.000Z', investValue: '100.00', products: [],
      }],
    },
    {
      id: 'program-2', name: 'Esporte', stationId: 'station-1', stationName: 'Mosaico',
      proposals: [{
        id: 'proposal-1', status: 'SENT', currentStep: 'PROPOSAL_SENT', viewerCanEdit: true,
        stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
        proposalTypeName: 'Patrocínio', advertiserName: 'Cliente A', createdByName: 'Ana',
        updatedAt: '2026-08-18T12:00:00.000Z', investValue: '100.00', products: [],
      }],
    },
    {
      id: 'sem-programa', name: 'Sem programa', stationId: 'station-1', stationName: 'Mosaico',
      proposals: [{
        id: 'proposal-2', status: 'DRAFT', currentStep: 'LEAD_CREATED', viewerCanEdit: false,
        stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
        proposalTypeName: 'Comercial', advertiserName: 'Cliente B', createdByName: 'Bruno',
        updatedAt: '2026-08-10T12:00:00.000Z', investValue: null, products: [],
      }],
    },
  ],
};

describe('proposalBoardModel', () => {
  it('deduplica a mesma proposta em dois programas no contexto Empresa', () => {
    const columns = buildProposalStageColumns(progressBoardFixture, 'station', 'station-1');
    const ids = columns.flatMap((column) => column.proposals.map((proposal) => proposal.id));
    expect(ids.filter((id) => id === 'proposal-1')).toHaveLength(1);
  });

  it('mantém somente propostas do Programa selecionado', () => {
    const columns = buildProposalStageColumns(progressBoardFixture, 'program', 'program-1');
    expect(columns.flatMap((column) => column.proposals).map((item) => item.id)).toEqual(['proposal-1']);
  });

  it('sempre devolve as sete etapas na ordem comercial', () => {
    expect(buildProposalStageColumns({ programs: [] }, 'station', 'station-1')).toHaveLength(7);
  });

  it('encontra a primeira etapa com propostas e volta para zero no vazio', () => {
    expect(getFirstPopulatedStageIndex(buildProposalStageColumns(progressBoardFixture, 'station', 'station-1'))).toBe(0);
    expect(getFirstPopulatedStageIndex(buildProposalStageColumns({ programs: [] }, 'station', 'station-1'))).toBe(0);
  });

  it('isola o grupo sintético sem-programa', () => {
    expect(filterWithoutProgram(progressBoardFixture).programs.every((program) => program.id === 'sem-programa')).toBe(true);
  });

  it('conta busca e filtros avançados sem contar contexto', () => {
    expect(countActiveProposalFilters('Mosaico', { status: 'SENT', stationId: 'station-1', programId: 'program-1' }, 'ADMIN')).toBe(2);
  });

  it('aplica responsável, tipo e período localmente', () => {
    const filtered = filterProposalBoardLocally(progressBoardFixture, {
      createdByName: 'Ana', proposalTypeName: 'Patrocínio', dateFrom: '2026-08-01', dateTo: '2026-08-31',
    });
    expect(filtered.programs.flatMap((program) => program.proposals).every((proposal) =>
      proposal.createdByName.includes('Ana') && proposal.proposalTypeName.includes('Patrocínio'),
    )).toBe(true);
  });

  it('encontra proposta por Empresa ou Programa e informa a localização', () => {
    const byStation = buildProposalSearchResults(progressBoardFixture, 'station', 'station-1', 'Mosaico');
    const byProgram = buildProposalSearchResults(progressBoardFixture, 'station', 'station-1', 'Jornal');

    expect(byStation).toHaveLength(2);
    expect(byProgram).toHaveLength(1);
    expect(byProgram[0]?.locationLabel).toContain('Jornal');
    expect(byProgram[0]?.locationLabel).toContain('Mosaico');
  });

  it('aceita somente data ISO real', () => {
    expect(isValidIsoBoardDate('2026-08-18')).toBe(true);
    expect(isValidIsoBoardDate('18/08/2026')).toBe(false);
    expect(isValidIsoBoardDate('2026-02-31')).toBe(false);
  });
});
