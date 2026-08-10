import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ProposalStatus } from '@/src/types';
import { PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS } from '@/src/utils/enums';

interface Props {
  status: ProposalStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: Props) {
  const color = PROPOSAL_STATUS_COLORS[status] ?? '#64748B';
  const label = PROPOSAL_STATUS_LABELS[status] ?? status;
  const small = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color + '50' }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: color }, small && styles.dotSmall]} />
      <Text style={[styles.label, { color }, small && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSmall: {
    width: 5,
    height: 5,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  labelSmall: {
    fontSize: 11,
  },
});
