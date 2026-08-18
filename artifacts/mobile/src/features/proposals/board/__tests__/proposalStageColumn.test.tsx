import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ProposalBoardCard } from '../ProposalBoardCard';
import { ProposalStageColumnView } from '../ProposalStageColumn';
import type { ProgressBoardProposal } from '@/src/api/contracts';

const proposal: ProgressBoardProposal = {
  id: 'proposal-1', status: 'SENT', currentStep: 'NEGOTIATION', viewerCanEdit: true,
  stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
  advertiserName: 'Cliente A', proposalTypeName: 'Patrocínio', createdByName: 'Ana',
  updatedAt: '2026-08-18T12:00:00.000Z', investValue: '100.00',
  products: [{ id: 'product-1', title: 'Produto', qty: '2', airTime: null, durationLabel: null, seasonality: undefined }],
};

describe('proposal stage column', () => {
  it('mostra card confortável com detalhes e movimento autorizado', () => {
    const screen = render(<ProposalBoardCard proposal={proposal} density="comfortable" canMove onOpen={jest.fn()} onMove={jest.fn()} />);
    expect(screen.getByText('2x Produto')).toBeTruthy();
    expect(screen.getByText('Atualizada em 18/08/2026')).toBeTruthy();
    expect(screen.getByLabelText('Mover proposta para outra etapa')).toBeTruthy();
  });

  it('mostra card compacto sem produtos e sem movimento negado', () => {
    const screen = render(<ProposalBoardCard proposal={proposal} density="compact" canMove={false} onOpen={jest.fn()} onMove={jest.fn()} />);
    expect(screen.queryByText('2x Produto')).toBeNull();
    expect(screen.queryByLabelText('Mover proposta para outra etapa')).toBeNull();
    expect(screen.getByLabelText(/Abrir proposta/)).toBeTruthy();
  });

  it('mantém cabeçalho e estado vazio dentro da coluna', () => {
    const screen = render(<ProposalStageColumnView column={{ step: 'NEGOTIATION', label: 'Negociação', proposals: [] }} density="comfortable" refreshing={false} onOpen={jest.fn()} onMove={jest.fn()} />);
    expect(screen.getByTestId('proposal-stage-card-NEGOTIATION')).toBeTruthy();
    expect(screen.getByText('Negociação')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.queryByText('Sem propostas')).toBeNull();
    expect(screen.queryByText('Nenhuma proposta nesta etapa.')).toBeNull();
  });

  it('abre a proposta sem disparar movimento ao tocar no card', () => {
    const onOpen = jest.fn();
    const onMove = jest.fn();
    const screen = render(<ProposalBoardCard proposal={proposal} density="comfortable" canMove onOpen={onOpen} onMove={onMove} />);
    fireEvent.press(screen.getByLabelText(/Abrir proposta/));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onMove).not.toHaveBeenCalled();
  });

  it('reserva o toque longo para iniciar o arraste sem abrir a proposta', () => {
    const onOpen = jest.fn();
    const onLongPress = jest.fn();
    const screen = render(<ProposalBoardCard proposal={proposal} canMove onOpen={onOpen} onMove={jest.fn()} onLongPress={onLongPress} />);
    const card = screen.getByLabelText(/Abrir proposta/);

    fireEvent(card, 'longPress');
    fireEvent.press(card);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
