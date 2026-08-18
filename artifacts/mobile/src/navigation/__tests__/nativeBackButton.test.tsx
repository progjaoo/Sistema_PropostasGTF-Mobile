import React from 'react';
import { render } from '@testing-library/react-native';
import { NativeBackButton } from '../NativeBackButton';

describe('NativeBackButton', () => {
  it('exposes a native-sized accessible back target', () => {
    const screen = render(<NativeBackButton onPress={jest.fn()} />);
    const button = screen.getByLabelText('Voltar');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.style).toEqual(expect.objectContaining({ minWidth: 44, minHeight: 44 }));
  });
});
