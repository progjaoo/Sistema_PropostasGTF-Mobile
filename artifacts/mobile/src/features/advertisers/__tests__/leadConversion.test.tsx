import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { LeadToClientSelector } from '../LeadToClientSelector';

const lead = { id: 'lead-1', tradeName: 'Lead Solar', active: true, status: 'LEAD' as const, createdAt: '2026-01-01' };

describe('lead conversion', () => {
  it('promotes the selected lead without creating another advertiser', async () => {
    const promote = jest.fn().mockResolvedValue({ ...lead, status: 'CLIENT' });
    const screen = render(<LeadToClientSelector leads={[lead]} onPromote={promote} pending={false} />);
    fireEvent.press(screen.getByText(lead.tradeName));
    fireEvent.press(screen.getByRole('button', { name: 'Converter em cliente' }));
    await waitFor(() => expect(promote).toHaveBeenCalledWith(lead.id));
  });
});
