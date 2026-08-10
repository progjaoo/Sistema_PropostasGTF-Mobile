import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  size?: 'small' | 'large';
  message?: string;
  full?: boolean;
}

export function LoadingSpinner({ size = 'large', message, full = true }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, full && styles.full]}>
      <ActivityIndicator size={size} color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.mutedForeground }]}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  full: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
