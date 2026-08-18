import React from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { UIButton, UICard, UIEmptyState, UIInput } from '@/src/ui';
import { spacing, tokens } from '@/src/theme';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatDate } from '@/src/utils/format';
import type { ProposalBoardSearchResult } from './proposalBoardModel';

export type ProposalSearchOverlayProps = {
  visible: boolean;
  value: string;
  resultCount: number;
  results: ProposalBoardSearchResult[];
  onChangeSearch: (value: string) => void;
  onOpenResult: (proposal: ProgressBoardProposal) => void;
  onOpenAdvanced: () => void;
  onClose: () => void;
  onClear: () => void;
};

export function ProposalSearchOverlay({
  visible,
  value,
  resultCount,
  results,
  onChangeSearch,
  onOpenResult,
  onOpenAdvanced,
  onClose,
  onClear,
}: ProposalSearchOverlayProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          testID="proposal-search-overlay-root"
          style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}
        >
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <UIInput autoFocus leftIcon="search" placeholder="Filtrar propostas..." value={value} onChangeText={onChangeSearch} returnKeyType="search" containerStyle={styles.input} />
            <UIButton variant="ghost" iconLeft="x" onPress={onClose} accessibilityLabel="Fechar busca de propostas" style={styles.close} />
          </View>
          <Text style={[styles.count, { color: colors.mutedForeground }]}>{resultCount === 1 ? '1 proposta' : `${resultCount} propostas`}</Text>
          <View style={styles.actions}>
            <UIButton title="Filtros avançados" variant="outline" onPress={onOpenAdvanced} style={styles.advanced} />
            {value.trim() && <UIButton title="Limpar busca" variant="ghost" onPress={onClear} style={styles.clear} />}
          </View>
          <FlatList
            data={results}
            keyExtractor={(item) => item.proposal.id}
            contentContainerStyle={styles.results}
            contentInsetAdjustmentBehavior="automatic"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => <ProposalSearchResultCard result={item} onOpen={onOpenResult} />}
            ListEmptyComponent={
              <UIEmptyState
                icon="search"
                title="Nenhuma proposta encontrada"
                description="Tente buscar por cliente, Empresa, Programa ou tipo de proposta."
                style={styles.empty}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProposalSearchResultCard({ result, onOpen }: { result: ProposalBoardSearchResult; onOpen: (proposal: ProgressBoardProposal) => void }) {
  const colors = useColors();
  const { proposal } = result;
  return (
    <UICard
      variant="elevated"
      onPress={() => onOpen(proposal)}
      accessibilityLabel={`Abrir proposta de ${proposal.advertiserName || 'cliente sem nome'}`}
      style={styles.resultCard}
    >
      <View style={styles.resultHeading}>
        <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>
          {proposal.advertiserName || 'Sem cliente'}
        </Text>
        <StatusBadge status={proposal.status} size="sm" />
      </View>
      <Text style={[styles.resultMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
        {proposal.proposalTypeName} · {proposal.createdByName}
      </Text>
      <Text style={[styles.location, { color: colors.primary }]} numberOfLines={2}>
        {result.locationLabel}
      </Text>
      <Text style={[styles.resultDate, { color: colors.mutedForeground }]}>
        {formatCurrency(proposal.investValue)} · Atualizada em {formatDate(proposal.updatedAt)}
      </Text>
    </UICard>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  root: { flex: 1, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderBottomWidth: 1, paddingBottom: spacing.md },
  input: { flex: 1 },
  close: { width: 44, paddingHorizontal: 0 },
  count: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  advanced: { flex: 1 },
  clear: { borderRadius: tokens.radius.lg },
  results: { gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  resultCard: { gap: spacing.xs },
  resultHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  resultTitle: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 17, lineHeight: 22 },
  resultMeta: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  location: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  resultDate: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  empty: { flex: 0, paddingVertical: spacing.xl },
});
