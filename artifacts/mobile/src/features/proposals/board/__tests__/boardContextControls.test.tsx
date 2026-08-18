import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { BoardContextToolbar } from '../BoardContextToolbar';
import { ProposalContextSheet, type ProposalContextOption } from '../ProposalContextSheet';

const options: ProposalContextOption[] = [{ id: 's1', name: 'Mosaico', color: '#2563EB' }];

describe('proposal board context controls', () => {
  it('alterna apenas entre Empresa e Programa', () => {
    const onGroupingChange = jest.fn();
    const screen = render(
      <BoardContextToolbar
        grouping="station"
        density="focused"
        contextLabel="Mosaico"
        activeFilterCount={0}
        onGroupingChange={onGroupingChange}
        onOpenContext={jest.fn()}
        onOpenSearch={jest.fn()}
        onToggleDensity={jest.fn()}
      />,
    );
    fireEvent.press(screen.getByText('Programa'));
    expect(onGroupingChange).toHaveBeenCalledWith('program');
    expect(screen.queryByText('Lista')).toBeNull();
    expect(screen.queryByText('Etapas')).toBeNull();
  });

  it('filtra opções e anuncia a selecionada', () => {
    const screen = render(
      <ProposalContextSheet
        visible
        grouping="station"
        options={options}
        selectedId="s1"
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    expect(screen.getByLabelText('Mosaico').props.accessibilityState).toEqual({ selected: true });
    fireEvent.changeText(screen.getByPlaceholderText('Buscar Empresa'), 'outra');
    expect(screen.getByText('Nenhuma Empresa encontrada')).toBeTruthy();
  });
});
