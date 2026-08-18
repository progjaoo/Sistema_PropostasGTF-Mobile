import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';

import { useColors } from '@/hooks/useColors';

type NativeBackButtonProps = {
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Consistent platform affordance for pushed screens without enabling stack headers globally. */
export function NativeBackButton({ onPress, accessibilityLabel = 'Voltar' }: NativeBackButtonProps) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={styles.button}
    >
      {Platform.OS === 'ios' ? (
        <SymbolView name="chevron.left" tintColor={colors.foreground} size={24} />
      ) : (
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
