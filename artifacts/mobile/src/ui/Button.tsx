import React from 'react';
import { Pressable, StyleSheet, Text, type PressableProps, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type UIButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  title?: string;
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: keyof typeof Feather.glyphMap;
  iconRight?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function UIButton({
  title,
  children,
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  iconColor,
  iconSize,
  disabled,
  style,
  textStyle,
  ...props
}: UIButtonProps) {
  const colors = useColors();
  const variantStyle = getVariantStyle(variant, colors);
  const contentColor = getContentColor(variant, colors);
  const resolvedIconSize = iconSize ?? (size === 'sm' ? 15 : 17);

  return (
    <Pressable
      {...props}
      accessibilityRole={props.accessibilityRole ?? 'button'}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[size],
        variantStyle.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {iconLeft ? <Feather name={iconLeft} size={resolvedIconSize} color={iconColor ?? contentColor} /> : null}
      {children ?? (
        <Text style={[styles.text, styles[`${size}Text`], { color: contentColor }, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}
      {iconRight ? <Feather name={iconRight} size={resolvedIconSize} color={iconColor ?? contentColor} /> : null}
    </Pressable>
  );
}

function getVariantStyle(variant: ButtonVariant, colors: ReturnType<typeof useColors>) {
  const variants = {
    primary: {
      container: { backgroundColor: colors.primary, borderColor: colors.primary },
    },
    secondary: {
      container: { backgroundColor: colors.muted, borderColor: colors.border },
    },
    outline: {
      container: { backgroundColor: 'transparent', borderColor: colors.border },
    },
    destructive: {
      container: { backgroundColor: colors.destructive, borderColor: colors.destructive },
    },
    ghost: {
      container: { backgroundColor: 'transparent', borderColor: 'transparent' },
    },
  };

  return variants[variant];
}

function getContentColor(variant: ButtonVariant, colors: ReturnType<typeof useColors>) {
  if (variant === 'primary') return colors.primaryForeground;
  if (variant === 'destructive') return colors.destructiveForeground;
  return colors.foreground;
}

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: tokens.radius.lg,
    borderCurve: 'continuous',
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  md: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 15,
  },
  lgText: {
    fontSize: 16,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
