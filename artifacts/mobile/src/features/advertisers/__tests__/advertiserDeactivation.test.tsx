import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ApiError } from '@/src/api/client';
import type { Advertiser } from '@/src/types';
import { AdvertiserDeactivateAction } from '../AdvertiserDeactivateAction';

const client: Advertiser = { id: 'client-1', tradeName: 'Cliente Solar', active: true, status: 'CLIENT', createdAt: '2026-01-01' };

describe('advertiser deactivation', () => {
  it('requires the advertiser name and keeps a conflict visible', async () => {
    const deactivate = jest.fn().mockRejectedValue(new ApiError(409, 'Possui propostas', {
      message: 'Este cliente possui propostas vinculadas e não pode ser excluído.', code: 'ADVERTISER_HAS_PROPOSALS', requiresConfirmation: true,
    }));
    const screen = render(<AdvertiserDeactivateAction advertiser={client} deactivate={deactivate} />);
    fireEvent.press(screen.getByText('Excluir cadastro'));
    fireEvent.changeText(screen.getByLabelText(`Digite ${client.tradeName} para confirmar`), client.tradeName);
    fireEvent.press(screen.getByRole('button', { name: 'Desativar cadastro' }));
    await waitFor(() => expect(deactivate).toHaveBeenCalledWith(client.id, false));
    expect(await screen.findByText('Este cliente possui propostas vinculadas e não pode ser excluído.')).toBeTruthy();
  });
});
