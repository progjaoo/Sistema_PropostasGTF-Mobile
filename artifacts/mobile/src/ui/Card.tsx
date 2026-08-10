import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewProps,
  type ViewStyle,
} from 'react-native';

import { useColors } from '@/hooks/useColors';
import { shadows, spacing, tokens } from '@/src/theme';

type CardVariant = 'default' | 'outlined' | 'elevated' | 'muted';

type BaseCardProps = {
  variant?: CardVariant;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

type UICardProps = BaseCardProps &
  Omit<ViewProps, 'style'> &
  Omit<PressableProps, 'style' | 'children'> & {
    onPress?: PressableProps['onPress'];
  };

export function UICard({ variant = 'default', style, children, onPress, disabled, ...props }: UICardProps) {
  const colors = useColors();
  const baseStyle = [
    styles.card,
    {
      backgroundColor: variant === 'muted' ? colors.muted : colors.card,
      borderColor: colors.border,
    },
    variant === 'elevated' && shadows.md,
    variant === 'outlined' && styles.outlined,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        {...props}
        accessibilityRole={props.accessibilityRole ?? 'button'}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [baseStyle, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View {...props} style={baseStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    borderCurve: 'continuous',
    padding: spacing.lg,
  },
  outlined: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.995 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
