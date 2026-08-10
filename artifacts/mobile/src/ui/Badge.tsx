import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';

type BadgeVariant =
  | 'default'
  | 'draft'
  | 'sent'
  | 'approved'
  | 'rejected'
  | 'archived'
  | 'lead'
  | 'client'
  | 'warning'
  | 'info';

type UIBadgeProps = {
  label: string;
  variant?: BadgeVariant;
  color?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function UIBadge({
  label,
  variant = 'default',
  color,
  size = 'md',
  showDot = false,
  style,
  testID,
}: UIBadgeProps) {
  const colors = useColors();
  const accent = color ?? getBadgeColor(variant, colors);
  const small = size === 'sm';

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        { backgroundColor: `${accent}1A`, borderColor: `${accent}40` },
        small && styles.badgeSmall,
        style,
      ]}
    >
      {showDot ? <View style={[styles.dot, { backgroundColor: accent }, small && styles.dotSmall]} /> : null}
      <Text style={[styles.label, { color: accent }, small && styles.labelSmall]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function getBadgeColor(variant: BadgeVariant, colors: ReturnType<typeof useColors>) {
  const map: Record<BadgeVariant, string> = {
    default: colors.primary,
    draft: colors.draft,
    sent: colors.sent,
    approved: colors.approved,
    rejected: colors.rejected,
    archived: colors.archived,
    lead: colors.warning,
    client: colors.success,
    warning: colors.warning,
    info: colors.info,
  };

  return map[variant];
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 26,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: tokens.radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeSmall: {
    minHeight: 22,
    paddingHorizontal: spacing.sm,
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
    borderRadius: 2.5,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  labelSmall: {
    fontSize: 11,
  },
});
