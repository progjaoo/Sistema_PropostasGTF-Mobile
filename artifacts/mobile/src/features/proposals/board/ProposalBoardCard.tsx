import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/src/utils/format';
import { UICard, UIButton, UISeparator } from '@/src/ui';
import { spacing } from '@/src/theme';

interface Props {
  proposal: ProgressBoardProposal;
  density?: ProposalBoardCardDensity;
  canMove?: boolean;
  contextLabel?: string;
  onOpen: () => void;
  onMove: () => void;
  onLongPress?: () => void;
  onLongPressEnd?: () => void;
  delayLongPress?: number;
}

export type ProposalBoardCardDensity = 'comfortable' | 'compact';

export function ProposalBoardCard({
  proposal,
  density = 'comfortable',
  canMove = true,
  contextLabel,
  onOpen,
  onMove,
  onLongPress,
  onLongPressEnd,
  delayLongPress,
}: Props) {
  const colors = useColors();
  const longPressRef = useRef(false);
  return (
    <UICard
      variant="elevated"
      accessibilityRole="button"
      accessibilityLabel={`Abrir proposta de ${proposal.advertiserName || 'cliente sem nome'}${contextLabel ? `, ${contextLabel}` : ''}, ${proposal.proposalTypeName}`}
      onPressIn={() => { longPressRef.current = false; }}
      onLongPress={() => {
        longPressRef.current = true;
        onLongPress?.();
      }}
      delayLongPress={delayLongPress}
      onPress={() => {
        if (longPressRef.current) {
          longPressRef.current = false;
          onLongPressEnd?.();
          return;
        }
        onOpen();
      }}
      style={[styles.card, density === 'compact' && styles.compactCard]}
    >
      <View style={styles.heading}>
        <Text style={[styles.title, density === 'compact' && styles.compactTitle, { color: colors.foreground }]} numberOfLines={density === 'compact' ? 1 : 2}>
          {proposal.advertiserName || 'Sem cliente'}
        </Text>
        <StatusBadge status={proposal.status} size="sm" />
      </View>
      <View style={[styles.valueRow, density === 'compact' && styles.compactValueRow]}>
        {!!proposal.investValue && (
          <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(proposal.investValue)}</Text>
        )}
      </View>
      <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={density === 'compact' ? 1 : 2}>
        {proposal.proposalTypeName} · {proposal.createdByName}
      </Text>
      {density === 'comfortable' && (
        <>
          <Text style={[styles.date, { color: colors.mutedForeground }]}>Atualizada em {formatDate(proposal.updatedAt)}</Text>
          <Text style={[styles.products, { color: colors.foreground }]} numberOfLines={2}>
            {proposal.products.map((item) => `${item.qty}x ${item.title}`).join(' · ') || 'Sem produtos'}
          </Text>
          {canMove && <>
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
          </>}
        </>
      )}
    </UICard>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  compactCard: { padding: spacing.md, gap: spacing.xs },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 17, lineHeight: 22 },
  compactTitle: { fontSize: 14, lineHeight: 18 },
  valueRow: { minHeight: 20 },
  compactValueRow: { minHeight: 16 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  products: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  date: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  move: { alignSelf: 'stretch' },
});
