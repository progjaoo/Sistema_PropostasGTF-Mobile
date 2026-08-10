import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ProposalStatus } from '@/src/types';
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '@/src/utils/enums';
import { UIBadge } from '@/src/ui';

interface Props {
  status: ProposalStatus;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function StatusBadge({ status, size = 'md', style, testID }: Props) {
  const color = PROPOSAL_STATUS_COLORS[status] ?? '#64748B';
  const label = PROPOSAL_STATUS_LABELS[status] ?? status;

  return <UIBadge testID={testID} label={label} size={size} color={color} showDot style={style} />;
}
