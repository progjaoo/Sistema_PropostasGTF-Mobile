import React from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UIInput } from '@/src/ui';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: keyof typeof Feather.glyphMap;
  rightIcon?: keyof typeof Feather.glyphMap;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function FormInput({
  label,
  error,
  hint,
  required,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword,
  containerStyle,
  ...props
}: Props) {
  return (
    <UIInput
      {...props}
      label={label}
      error={error}
      hint={hint}
      required={required}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      onRightIconPress={onRightIconPress}
      isPassword={isPassword}
      containerStyle={containerStyle}
    />
  );
}
