import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';

type UIChipProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  active?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  style?: StyleProp<ViewStyle>;
};

export function UIChip({ label, active = false, icon, style, disabled, ...props }: UIChipProps) {
  const colors = useColors();
  const contentColor = active ? colors.primaryForeground : colors.foreground;

  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? 'button'}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon ? <Feather name={icon} size={14} color={contentColor} /> : null}
      <Text style={[styles.label, { color: contentColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: tokens.radius.full,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.5,
  },
});
