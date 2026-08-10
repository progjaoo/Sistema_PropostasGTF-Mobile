import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/hooks/useColors';

type UISeparatorProps = {
  vertical?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function UISeparator({ vertical = false, style, testID }: UISeparatorProps) {
  const colors = useColors();

  return (
    <View
      testID={testID}
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: colors.border },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  vertical: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
});
