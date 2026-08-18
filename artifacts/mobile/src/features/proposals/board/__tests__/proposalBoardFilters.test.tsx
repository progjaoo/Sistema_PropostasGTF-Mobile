import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { ActiveProposalFilters } from '../ActiveProposalFilters';
import { ProposalSearchOverlay } from '../ProposalSearchOverlay';
import { ProposalFiltersSheet } from '../ProposalFiltersSheet';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('proposal board filters', () => {
  it('aplica busca sem trocar o contexto', () => {
    const onChangeSearch = jest.fn();
    const screen = render(
      <ProposalSearchOverlay
        visible
        value=""
        resultCount={38}
        results={[]}
        onChangeSearch={onChangeSearch}
        onOpenResult={jest.fn()}
        onOpenAdvanced={jest.fn()}
        onClose={jest.fn()}
        onClear={jest.fn()}
      />,
    );
    fireEvent.changeText(screen.getByPlaceholderText('Filtrar propostas...'), 'Mosaico');
    expect(onChangeSearch).toHaveBeenCalledWith('Mosaico');
    expect(screen.getByText('38 propostas')).toBeTruthy();
  });

  it('não mostra Empresa nem Programa nos filtros avançados', () => {
    const screen = render(<ProposalFiltersSheet visible filters={{}} role="ADMIN" onClose={jest.fn()} onApply={jest.fn()} onClear={jest.fn()} />);
    expect(screen.queryByText('Empresa')).toBeNull();
    expect(screen.queryByText('Programa')).toBeNull();
    expect(screen.getByPlaceholderText('Responsável')).toBeTruthy();
  });

  it('oculta Responsável para COMERCIAL e bloqueia data inválida', () => {
    const onApply = jest.fn();
    const screen = render(<ProposalFiltersSheet visible filters={{}} role="COMERCIAL" onClose={jest.fn()} onApply={onApply} onClear={jest.fn()} />);
    expect(screen.queryByPlaceholderText('Responsável')).toBeNull();
    fireEvent.changeText(screen.getByPlaceholderText('Data inicial (AAAA-MM-DD)'), '18/08/2026');
    fireEvent.press(screen.getByText('Aplicar filtros'));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByText('Use o formato AAAA-MM-DD.')).toBeTruthy();
  });

  it('remove um filtro ativo pelo chip', () => {
    const onRemove = jest.fn();
    const screen = render(<ActiveProposalFilters search="Mosaico" filters={{ status: 'SENT' }} onRemove={onRemove} />);
    fireEvent.press(screen.getByLabelText('Remover filtro Busca: Mosaico'));
    expect(onRemove).toHaveBeenCalledWith('search');
  });
});
