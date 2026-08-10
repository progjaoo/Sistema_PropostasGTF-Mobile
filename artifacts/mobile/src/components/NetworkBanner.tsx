import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Feather } from '@expo/vector-icons';

import { useColors } from '@/hooks/useColors';
import { spacing } from '@/src/theme';

export function NetworkBanner() {
  const colors = useColors();
  const [offline, setOffline] = useState(false);

  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        setOffline(state.isConnected === false || state.isInternetReachable === false);
      }),
    [],
  );

  if (!offline) return null;

  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.banner,
        {
          backgroundColor: colors.warning,
          borderBottomColor: colors.warningForeground + '22',
        },
      ]}
    >
      <Feather name="wifi-off" size={16} color={colors.warningForeground} />
      <Text style={[styles.text, { color: colors.warningForeground }]}>
        Sem conexão. Dados salvos ainda podem ser consultados.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  text: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    flexShrink: 1,
  },
});
