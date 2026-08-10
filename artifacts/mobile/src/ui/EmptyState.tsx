import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';
import { UIButton } from './Button';

type UIEmptyStateProps = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function UIEmptyState({ icon = 'inbox', title, description, actionLabel, onAction, style, testID }: UIEmptyStateProps) {
  const colors = useColors();

  return (
    <View testID={testID} style={[styles.container, style]}>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={icon} size={30} color={colors.mutedForeground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      {description ? <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text> : null}
      {actionLabel && onAction ? <UIButton title={actionLabel} onPress={onAction} size="md" style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxxl,
    gap: spacing.md,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xs,
  },
});
