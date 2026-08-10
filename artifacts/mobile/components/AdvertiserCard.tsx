import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Advertiser } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIAvatar, UIBadge, UICard } from '@/src/ui';

interface Props {
  advertiser: Advertiser;
  onPress: () => void;
  badge?: string;
  badgeColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function AdvertiserCard({ advertiser, onPress, badge, badgeColor, style, testID }: Props) {
  const colors = useColors();

  return (
    <UICard
      testID={testID}
      style={[styles.card, style]}
      onPress={onPress}
    >
      <UIAvatar name={advertiser.tradeName} imageBase64={advertiser.logoBase64} size={44} />
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {advertiser.tradeName}
          </Text>
          {badge && (
            <UIBadge label={badge} size="sm" color={badgeColor ?? colors.primary} />
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
    </UICard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 5,
    gap: 12,
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
