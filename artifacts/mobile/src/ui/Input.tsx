import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';

type UIInputProps = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function UIInput({
  label,
  error,
  hint,
  required,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword,
  style,
  containerStyle,
  testID,
  ...props
}: UIInputProps) {
  const colors = useColors();
  const [showPassword, setShowPassword] = useState(false);
  const secureTextEntry = isPassword ? !showPassword : props.secureTextEntry;
  const iconColor = error ? colors.destructive : colors.mutedForeground;

  return (
    <View testID={testID ? `${testID}-container` : undefined} style={[styles.wrapper, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
          {required ? <Text style={{ color: colors.destructive }}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: colors.card,
            borderColor: error ? colors.destructive : colors.border,
          },
        ]}
      >
        {leftIcon ? <Feather name={leftIcon} size={18} color={iconColor} style={styles.leftIcon} /> : null}
        <TextInput
          {...props}
          testID={testID}
          style={[
            styles.input,
            { color: colors.foreground },
            leftIcon && styles.inputWithLeft,
            (rightIcon || isPassword) && styles.inputWithRight,
            style,
          ]}
          placeholderTextColor={colors.mutedForeground}
          secureTextEntry={secureTextEntry}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          autoCorrect={isPassword ? false : props.autoCorrect}
        />
        {isPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            testID={testID ? `${testID}-password-toggle` : undefined}
            onPress={() => setShowPassword((value) => !value)}
            hitSlop={8}
            style={styles.rightIcon}
          >
            <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={iconColor} />
          </Pressable>
        ) : null}
        {rightIcon && !isPassword ? (
          <Pressable
            accessibilityRole="button"
            testID={testID ? `${testID}-right-icon` : undefined}
            onPress={onRightIconPress}
            hitSlop={8}
            style={styles.rightIcon}
          >
            <Feather name={rightIcon} size={18} color={iconColor} />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={[styles.message, { color: colors.destructive }]}>{error}</Text> : null}
      {hint && !error ? <Text style={[styles.message, { color: colors.mutedForeground }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  inputRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: tokens.radius.lg,
    borderCurve: 'continuous',
  },
  leftIcon: {
    marginLeft: spacing.lg,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  inputWithLeft: {
    paddingLeft: spacing.sm,
  },
  inputWithRight: {
    paddingRight: spacing.sm,
  },
  rightIcon: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
