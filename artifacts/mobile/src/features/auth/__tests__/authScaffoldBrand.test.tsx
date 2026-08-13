import React from 'react';
import { render } from '@testing-library/react-native';

import { BRAND } from '@/src/config/brand';
import { AuthScaffold } from '../AuthScaffold';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

jest.mock('@/components/KeyboardAwareScrollViewCompat', () => {
  const React = require('react');
  const { ScrollView } = require('react-native');
  return {
    KeyboardAwareScrollViewCompat: ({ children, ...props }: { children: React.ReactNode }) => (
      <ScrollView {...props}>{children}</ScrollView>
    ),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Feather: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe('AuthScaffold Mosaico brand', () => {
  it('shows Mosaico product copy and removes legacy GTF copy from public screens', () => {
    const { getByText, queryByText } = render(
      <AuthScaffold showBrand>
        <></>
      </AuthScaffold>,
    );

    expect(getByText(BRAND.productName)).toBeTruthy();
    expect(getByText(BRAND.systemName)).toBeTruthy();
    expect(queryByText('GTF Propostas')).toBeNull();
    expect(queryByText('Sistema Comercial GTF')).toBeNull();
    expect(queryByText('Grupo Torre Forte agora é Mosaico')).toBeNull();
  });
});
