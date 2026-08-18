import React from 'react';
import { render } from '@testing-library/react-native';
import type { ProposalStageColumn } from '../proposalBoardModel';
import { PROPOSAL_STAGES } from '../proposalBoardModel';
import { ContextualProposalKanban, getProposalColumnWidth } from '../ContextualProposalKanban';

jest.mock('../ProposalStageColumn', () => ({
  ProposalStageColumnView: ({ column }: { column: ProposalStageColumn }) => (
    <>{column.label}</>
  ),
}));

const columns: ProposalStageColumn[] = PROPOSAL_STAGES.map((step, index) => ({
  step,
  label: `Etapa ${index + 1}`,
  proposals: [],
}));

describe('ContextualProposalKanban', () => {
  it('usa paginação e indicadores no modo focado', () => {
    const screen = render(
      <ContextualProposalKanban
        density="focused"
        columns={columns}
        contextKey="station:s1"
        refreshing={false}
        onRefresh={jest.fn()}
        onOpen={jest.fn()}
        onMove={jest.fn()}
      />,
    );

    expect(screen.getByTestId('proposal-kanban-focused')).toBeTruthy();
    expect(screen.getByTestId('proposal-kanban-focused-page')).toBeTruthy();
    expect(screen.getAllByLabelText(/Etapa .* de 7/)).toHaveLength(7);
    expect(screen.queryByTestId('proposal-kanban-overview')).toBeNull();
  });

  it('usa rolagem livre e sem indicadores no modo expandido', () => {
    const screen = render(
      <ContextualProposalKanban
        density="overview"
        columns={columns}
        contextKey="station:s1"
        refreshing={false}
        onRefresh={jest.fn()}
        onOpen={jest.fn()}
        onMove={jest.fn()}
      />,
    );

    expect(screen.getByTestId('proposal-kanban-overview')).toBeTruthy();
    expect(screen.queryByTestId('proposal-kanban-pagination')).toBeNull();
  });

  it.each([
    [320, 'focused', 288],
    [390, 'focused', 358],
    [768, 'overview', 360],
    [1024, 'overview', 360],
  ] as const)('calcula largura responsiva para %ipx em %s', (width, density, expected) => {
    expect(getProposalColumnWidth(width, density)).toBe(expected);
  });
});
