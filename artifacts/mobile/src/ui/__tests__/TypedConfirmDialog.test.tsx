import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { TypedConfirmDialog } from '../TypedConfirmDialog';

describe('TypedConfirmDialog', () => {
  it('enables the destructive action only after an exact name match', () => {
    const onConfirm = jest.fn();
    const screen = render(
      <TypedConfirmDialog
        visible
        title="Excluir empresa"
        resourceName="Rádio Centro"
        description="A exclusão é permanente."
        confirmLabel="Excluir permanentemente"
        pending={false}
        onCancel={jest.fn()}
        onConfirm={onConfirm}
      />,
    );

    const confirm = screen.getByRole('button', { name: 'Excluir permanentemente' });
    expect(confirm).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText('Digite Rádio Centro para confirmar'), 'Rádio Centro');
    fireEvent.press(confirm);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
