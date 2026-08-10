import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Advertiser } from '@/src/types';
import { getInitials } from '@/src/utils/format';
import { useColors } from '@/hooks/useColors';

interface Props {
  advertiser: Advertiser;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
}

export function AdvertiserCard({ advertiser, onPress, badge, badgeColor }: Props) {
  const colors = useColors();
  const initials = getInitials(advertiser.tradeName);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
        <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {advertiser.tradeName}
          </Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: (badgeColor ?? colors.primary) + '20' }]}>
              <Text style={[styles.badgeText, { color: badgeColor ?? colors.primary }]}>{badge}</Text>
            </View>
          )}
        </View>
        {advertiser.contactName && (
          <Text style={[styles.contact, { color: colors.mutedForeground }]} numberOfLines={1}>
            {advertiser.contactName}
          </Text>
        )}
        {advertiser.contactPhone && (
          <View style={styles.phoneRow}>
            <Feather name="phone" size={11} color={colors.mutedForeground} />
            <Text style={[styles.phone, { color: colors.mutedForeground }]}>{advertiser.contactPhone}</Text>
          </View>
        )}
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initials: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  contact: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phone: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});
