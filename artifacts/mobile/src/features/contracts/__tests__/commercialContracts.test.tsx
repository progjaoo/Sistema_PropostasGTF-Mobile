import React from 'react';
import { render } from '@testing-library/react-native';
import { CommercialContractsScreen } from '../CommercialContractsScreen';

const ownContract = { id: 'contract-1', ownerId: 'seller-a', advertiserId: 'adv-1', advertiserName: 'Cliente Solar', proposalId: 'proposal-1', proposalName: 'Campanha', monthlyValue: '2000.00', saleDate: '2026-01-01', startDate: '2026-02-01', endDate: '2026-12-31', installmentDueDay: 10, status: 'ACTIVE' as const, createdAt: '2026-01-01', updatedAt: '2026-01-01' };

describe('commercial contracts', () => {
  it('shows own-contract controls without an owner filter', () => {
    const screen = render(<CommercialContractsScreen contracts={[ownContract]} summary={{ month: '2026-08', soldThisMonth: '2000.00', expectedRevenue: '2000.00', activeContracts: 1, endingIn30Days: 0 }} forecast={{ from: '2026-08', months: 12, data: [] }} onSelect={jest.fn()} onCreate={jest.fn()} />);
    expect(screen.getByText('Meus Contratos')).toBeTruthy();
    expect(screen.queryByText('Todos os responsáveis')).toBeNull();
    expect(screen.getByText(ownContract.advertiserName)).toBeTruthy();
  });
});
