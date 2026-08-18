import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommercialContractSummary } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

export function ContractSummary({ summary }: { summary: CommercialContractSummary }) {
  const colors = useColors();
  const items = [
    ['Vendido no mês', summary.soldThisMonth], ['Receita prevista', summary.expectedRevenue],
    ['Contratos ativos', String(summary.activeContracts)], ['Encerrando em 30 dias', String(summary.endingIn30Days)],
  ];
  return <View style={styles.grid}>{items.map(([label, value]) => <UICard key={label} variant="elevated" style={styles.card}><Text style={[styles.value, { color: colors.foreground }]}>{label.startsWith('Contratos') || label.startsWith('Encerrando') ? value : `R$ ${value.replace('.', ',')}`}</Text><Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text></UICard>)}</View>;
}

const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, card: { width: '48%', gap: 4 }, value: { fontSize: 17, fontFamily: 'Inter_700Bold' }, label: { fontSize: 11, fontFamily: 'Inter_400Regular' } });
