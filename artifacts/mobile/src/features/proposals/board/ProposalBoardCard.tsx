import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/src/utils/format';
import { UICard, UIButton, UISeparator } from '@/src/ui';
import { spacing } from '@/src/theme';

interface Props {
  proposal: ProgressBoardProposal;
  onOpen: () => void;
  onMove: () => void;
}

export function ProposalBoardCard({ proposal, onOpen, onMove }: Props) {
  const colors = useColors();
  return (
    <UICard
      variant="elevated"
      accessibilityRole="button"
      onPress={onOpen}
      style={styles.card}
    >
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {proposal.advertiserName || 'Sem cliente'}
        </Text>
        <StatusBadge status={proposal.status} size="sm" />
      </View>
      <View style={styles.valueRow}>
        {!!proposal.investValue && (
          <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(proposal.investValue)}</Text>
        )}
      </View>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {proposal.proposalTypeName} · {proposal.createdByName}
      </Text>
      <Text style={[styles.products, { color: colors.foreground }]} numberOfLines={2}>
        {proposal.products.map((item) => `${item.qty}x ${item.title}`).join(' · ') || 'Sem produtos'}
      </Text>
      <UISeparator />
      <UIButton
        accessibilityRole="button"
        accessibilityLabel="Mover proposta para outra etapa"
        variant="ghost"
        size="sm"
        iconLeft="repeat"
        title="Mover etapa"
        style={styles.move}
        onPress={(event) => {
          event.stopPropagation();
          onMove();
        }}
        textStyle={{ color: colors.primary }}
      />
    </UICard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 17, lineHeight: 22 },
  valueRow: { minHeight: 20 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  products: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  move: { alignSelf: 'stretch' },
});
