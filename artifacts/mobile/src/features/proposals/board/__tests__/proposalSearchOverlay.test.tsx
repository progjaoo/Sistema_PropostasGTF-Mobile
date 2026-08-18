import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ProposalSearchOverlay } from '../ProposalSearchOverlay';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 59, bottom: 34, left: 0, right: 0 }),
}));

const result = {
  proposal: {
    id: 'proposal-1', status: 'SENT' as const, currentStep: 'PROPOSAL_SENT' as const, viewerCanEdit: true,
    stationId: 'station-1', stationName: 'Mosaico', primaryColor: '#427EFF',
    proposalTypeName: 'Patrocínio', advertiserName: 'Cliente A', createdByName: 'Ana',
    updatedAt: '2026-08-18T12:00:00.000Z', investValue: '100.00', products: [],
  },
  programName: 'Jornal',
  locationLabel: 'Mosaico · Jornal',
};

describe('ProposalSearchOverlay', () => {
  it('renderiza resultados em cards com sua localização e abre a proposta', () => {
    const onOpenResult = jest.fn();
    const screen = render(
      <ProposalSearchOverlay
        visible
        value="Cliente"
        resultCount={1}
        results={[result]}
        onChangeSearch={jest.fn()}
        onOpenResult={onOpenResult}
        onOpenAdvanced={jest.fn()}
        onClose={jest.fn()}
        onClear={jest.fn()}
      /> as any,
    );

    expect(screen.getByText('Cliente A')).toBeTruthy();
    expect(screen.getByText('Mosaico · Jornal')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Abrir proposta de Cliente A'));
    expect(onOpenResult).toHaveBeenCalledWith(result.proposal);
  });

  it('posiciona o overlay abaixo da area segura do topo e reserva o rodape', () => {
    const screen = render(
      <ProposalSearchOverlay
        visible
        value=""
        resultCount={1}
        results={[result]}
        onChangeSearch={jest.fn()}
        onOpenResult={jest.fn()}
        onOpenAdvanced={jest.fn()}
        onClose={jest.fn()}
        onClear={jest.fn()}
      />,
    );

    const rootStyle = StyleSheet.flatten(screen.getByTestId('proposal-search-overlay-root').props.style);
    expect(rootStyle.paddingTop).toBe(67);
    expect(rootStyle.paddingBottom).toBe(46);
  });
});
