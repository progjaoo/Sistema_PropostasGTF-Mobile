import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CommercialContract } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UICard, UIEmptyState } from '@/src/ui';
import { spacing } from '@/src/theme';

export function ContractList({ contracts, onSelect }: { contracts: CommercialContract[]; onSelect: (contract: CommercialContract) => void }) {
  const colors = useColors();
  if (!contracts.length) return <UIEmptyState icon="file-text" title="Nenhum contrato encontrado" />;
  return <View style={styles.list}>{contracts.map((contract) => <UICard key={contract.id} variant="elevated" style={styles.card} onPress={() => onSelect(contract)} accessibilityLabel={`Abrir contrato ${contract.advertiserName ?? contract.id}`}><View style={styles.row}><View style={{ flex: 1, gap: 3 }}><Text style={[styles.title, { color: colors.foreground }]}>{contract.advertiserName ?? 'Cliente sem nome'}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{contract.proposalName ?? 'Proposta'} · {contract.ownerName ?? 'Responsável'}</Text></View><UIBadge label={contract.status === 'ACTIVE' ? 'Ativo' : 'Cancelado'} color={contract.status === 'ACTIVE' ? colors.success : colors.mutedForeground} size="sm" /></View><Text style={[styles.value, { color: colors.foreground }]}>R$ {contract.monthlyValue.replace('.', ',')} / mês</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>Vigência: {contract.startDate} a {contract.endDate} · vencimento dia {contract.installmentDueDay}</Text></UICard>)}</View>;
}

const styles = StyleSheet.create({ list: { gap: spacing.sm }, card: { gap: spacing.sm }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, title: { fontSize: 15, fontFamily: 'Inter_700Bold' }, meta: { fontSize: 12, fontFamily: 'Inter_400Regular' }, value: { fontSize: 16, fontFamily: 'Inter_700Bold' } });
