import type { ProposalProgressBoard } from '@/src/api/contracts';
import { buildProposalStageColumns } from '../proposalBoardModel';

const board: ProposalProgressBoard = {
  programs: [
    {
      id: 'program-jornal', name: 'Jornal', stationId: 'station-1', stationName: 'Mosaico',
      proposals: [{
        id: 'proposal-1', status: 'SENT', currentStep: 'PROPOSAL_SENT', viewerCanEdit: true,
        stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
        proposalTypeName: 'Patrocínio', advertiserName: 'Cliente A', createdByName: 'Ana',
        updatedAt: '2026-08-18T12:00:00.000Z', investValue: '100.00', products: [],
      }],
    },
    {
      id: 'program-esporte', name: 'Esporte', stationId: 'station-1', stationName: 'Mosaico',
      proposals: [{
        id: 'proposal-1', status: 'SENT', currentStep: 'PROPOSAL_SENT', viewerCanEdit: true,
        stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
        proposalTypeName: 'Patrocínio', advertiserName: 'Cliente A', createdByName: 'Ana',
        updatedAt: '2026-08-18T12:00:00.000Z', investValue: '100.00', products: [],
      }],
    },
  ],
};

describe('contextual proposal board migration', () => {
  it('deduplicates a proposal linked to multiple programs in Empresa context', () => {
    const columns = buildProposalStageColumns(board, 'station', 'station-1');
    const proposals = columns.flatMap((column) => column.proposals);
    expect(proposals.filter((proposal) => proposal.id === 'proposal-1')).toHaveLength(1);
  });
});
