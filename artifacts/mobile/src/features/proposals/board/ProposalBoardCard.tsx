import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';

interface Props {
  proposal: ProgressBoardProposal;
  onOpen: () => void;
  onMove: () => void;
}

export function ProposalBoardCard({ proposal, onOpen, onMove }: Props) {
  const colors = useColors();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onOpen}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {proposal.advertiserName || 'Sem cliente'}
        </Text>
        {!!proposal.investValue && (
          <Text style={[styles.value, { color: colors.foreground }]}>R$ {proposal.investValue}</Text>
        )}
      </View>
      <Text style={[styles.meta, { color: colors.mutedForeground }]}>
        {proposal.proposalTypeName} · {proposal.createdByName}
      </Text>
      <Text style={[styles.products, { color: colors.foreground }]} numberOfLines={2}>
        {proposal.products.map((item) => `${item.qty}x ${item.title}`).join(' · ') || 'Sem produtos'}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Mover proposta para outra etapa"
        style={[styles.move, { borderColor: colors.border }]}
        onPress={(event) => {
          event.stopPropagation();
          onMove();
        }}
      >
        <Feather name="repeat" size={16} color={colors.primary} />
        <Text style={[styles.moveText, { color: colors.primary }]}>Mover para etapa</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 16 },
  value: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  products: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 18 },
  move: { minHeight: 44, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  moveText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});
