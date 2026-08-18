import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommercialContractForecastResponse } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

export function RevenueForecast({ forecast }: { forecast: CommercialContractForecastResponse }) {
  const colors = useColors();
  return <UICard variant="elevated" style={styles.card}><Text style={[styles.title, { color: colors.foreground }]}>Previsão de 12 meses</Text>{forecast.data.map((item) => <View key={item.month} style={styles.row}><Text style={[styles.month, { color: colors.mutedForeground }]}>{item.month}</Text><Text style={[styles.value, { color: colors.foreground }]}>R$ {item.expectedRevenue.replace('.', ',')}</Text></View>)}</UICard>;
}

const styles = StyleSheet.create({ card: { gap: spacing.sm }, title: { fontSize: 16, fontFamily: 'Inter_700Bold' }, row: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 }, month: { fontSize: 13 }, value: { fontSize: 13, fontFamily: 'Inter_600SemiBold' } });
