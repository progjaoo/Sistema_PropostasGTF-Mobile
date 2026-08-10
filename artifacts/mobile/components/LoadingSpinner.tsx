import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/src/theme';

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
        <Text style={[styles.message, { color: colors.mutedForeground }]} numberOfLines={2}>{message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  full: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
