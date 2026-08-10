import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { AdvertiserCard } from '@/components/AdvertiserCard';
import { showConfirm } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { FormInput } from '@/components/FormInput';
import { ProposalCard } from '@/components/ProposalCard';
import { StatusBadge } from '@/components/StatusBadge';
import type { Advertiser, ProposalSummary } from '@/src/types';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Feather: ({ name, testID }: { name: string; testID?: string }) => <Text testID={testID}>{name}</Text>,
  };
});

const advertiser: Advertiser = {
  id: 'advertiser-1',
  tradeName: 'Supermercado Bom Preco',
  contactName: 'Carlos Silva',
  contactPhone: '(11) 3000-8888',
  active: true,
  status: 'LEAD',
  createdAt: '2026-07-10T12:00:00.000Z',
};

const proposal: ProposalSummary = {
  id: 'proposal-1',
  status: 'SENT',
  propType: 'Pacote Promocional',
  propMonth: '7',
  propYear: '2026',
  clientLine1: 'Supermercado Bom Preco',
  advertiserTradeName: 'Supermercado Bom Preco',
  stationId: 'station-1',
  stationName: 'Radio 88 FM',
  proposalTypeName: 'Pacote Promocional',
  createdById: 'user-1',
  createdByName: 'Carlos Silva',
  investValue: '1500.00',
  createdAt: '2026-07-10T12:00:00.000Z',
  updatedAt: '2026-07-10T12:00:00.000Z',
};

describe('legacy visual component contracts', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders StatusBadge with the current status label and testID', () => {
    const { getByText, getByTestId } = render(<StatusBadge status="SENT" size="sm" testID="status-badge" />);

    expect(getByText('Enviada')).toBeTruthy();
    expect(getByTestId('status-badge')).toBeTruthy();
  });

  it('preserves EmptyState action rendering and callback behavior', () => {
    const onAction = jest.fn();
    const { getByText, getByTestId } = render(
      <EmptyState
        testID="empty-state"
        title="Sem propostas"
        description="Nenhum registro encontrado"
        actionLabel="Criar"
        onAction={onAction}
      />,
    );

    expect(getByTestId('empty-state')).toBeTruthy();
    fireEvent.press(getByText('Criar'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('preserves FormInput native props and password toggle behavior', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText, getByTestId, rerender } = render(
      <FormInput
        testID="password-field"
        label="Senha"
        placeholder="Digite sua senha"
        isPassword
        value="secret"
        onChangeText={onChangeText}
      />,
    );

    const input = getByPlaceholderText('Digite sua senha');
    fireEvent.changeText(input, 'nova');
    expect(onChangeText).toHaveBeenCalledWith('nova');
    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(getByTestId('password-field-password-toggle'));
    rerender(<FormInput testID="password-field" placeholder="Digite sua senha" isPassword value="secret" />);
    expect(getByPlaceholderText('Digite sua senha').props.secureTextEntry).toBe(false);
  });

  it('preserves ProposalCard navigation and owner display', () => {
    const { getByText, getByTestId } = render(
      <ProposalCard proposal={proposal} showOwner testID="proposal-card" />,
    );

    expect(getByText('Supermercado Bom Preco')).toBeTruthy();
    expect(getByText('Carlos Silva')).toBeTruthy();
    fireEvent.press(getByTestId('proposal-card'));
    expect(mockPush).toHaveBeenCalledWith('/proposal/proposal-1');
  });

  it('preserves AdvertiserCard callback, badge and contact fields', () => {
    const onPress = jest.fn();
    const { getByText, getByTestId } = render(
      <AdvertiserCard advertiser={advertiser} badge="Lead" onPress={onPress} testID="advertiser-card" />,
    );

    expect(getByText('Supermercado Bom Preco')).toBeTruthy();
    expect(getByText('Lead')).toBeTruthy();
    expect(getByText('Carlos Silva')).toBeTruthy();
    fireEvent.press(getByTestId('advertiser-card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps showConfirm backed by native Alert with destructive style', () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
    const onConfirm = jest.fn();

    showConfirm({
      title: 'Excluir',
      message: 'Tem certeza?',
      confirmText: 'Excluir',
      destructive: true,
      onConfirm,
    });

    expect(alertSpy).toHaveBeenCalledWith(
      'Excluir',
      'Tem certeza?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Excluir', style: 'destructive', onPress: onConfirm }),
      ]),
    );

    alertSpy.mockRestore();
  });
});
