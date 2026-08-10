import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UIEmptyState } from '@/src/ui';

interface Props {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({ icon = 'inbox', title, description, actionLabel, onAction, style, testID }: Props) {
  return (
    <UIEmptyState
      testID={testID}
      icon={icon}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
      style={style}
    />
  );
}
