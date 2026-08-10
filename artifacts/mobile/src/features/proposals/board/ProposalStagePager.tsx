import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import type { ProposalProgressBoard, ProgressBoardProposal } from '@/src/api/contracts';
import type { ProposalTimelineStep } from '@/src/types';
import { TIMELINE_STEP_LABELS } from '@/src/utils/enums';
import { useColors } from '@/hooks/useColors';
import { ProposalBoardCard } from './ProposalBoardCard';
import { MoveProposalSheet } from './MoveProposalSheet';
import { UIBadge, UICard, UIEmptyState } from '@/src/ui';
import { spacing } from '@/src/theme';

const STAGES: ProposalTimelineStep[] = [
  'LEAD_CREATED',
  'IN_CONVERSATION',
  'PROPOSAL_SENT',
  'CLIENT_REVIEWING',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
];

export function ProposalStagePager({
  board,
  onMove,
  moving,
  refreshing = false,
  onRefresh,
}: {
  board: ProposalProgressBoard;
  onMove: (proposalId: string, step: ProposalTimelineStep) => void;
  moving: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}) {
  const colors = useColors();
  const { height, width } = useWindowDimensions();
  const columnWidth = Math.max(288, width - 32);
  const columnHeight = Math.max(420, height - 238);
  const [selected, setSelected] = useState<{ proposal: ProgressBoardProposal } | null>(null);
  const proposals = useMemo(() => dedupeProposals(board.programs.flatMap((program) => program.proposals)), [board]);

  return (
    <>
      <FlatList
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        data={STAGES}
        keyExtractor={(stage) => stage}
        renderItem={({ item: stage }) => {
          const stageItems = proposals.filter((proposal) => proposal.currentStep === stage);
          return (
            <View style={[styles.column, { width: columnWidth, height: columnHeight }]}>
              <UICard variant="muted" style={styles.columnHeader}>
                <Text style={[styles.stage, { color: colors.foreground }]}>{TIMELINE_STEP_LABELS[stage]}</Text>
                <UIBadge label={String(stageItems.length)} variant={stageItems.length ? 'info' : 'default'} size="sm" />
              </UICard>
              <FlatList
                data={stageItems}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.cards}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined
                }
                renderItem={({ item }) => (
                  <ProposalBoardCard
                    proposal={item}
                    onOpen={() => router.push(`/proposal/${item.id}`)}
                    onMove={() => setSelected({ proposal: item })}
                  />
                )}
                ListEmptyComponent={
                  <UIEmptyState
                    icon="inbox"
                    title="Sem propostas"
                    description="Nenhuma proposta nesta etapa."
                    style={styles.emptyState}
                  />
                }
              />
            </View>
          );
        }}
      />
      <MoveProposalSheet
        visible={!!selected}
        pending={moving}
        onClose={() => setSelected(null)}
        onSelect={(step) => {
          if (!selected) return;
          onMove(selected.proposal.id, step);
          setSelected(null);
        }}
      />
    </>
  );
}

function dedupeProposals(proposals: ProgressBoardProposal[]): ProgressBoardProposal[] {
  const byId = new Map<string, ProgressBoardProposal>();
  proposals.forEach((proposal) => {
    if (!byId.has(proposal.id)) {
      byId.set(proposal.id, proposal);
    }
  });
  return Array.from(byId.values());
}

const styles = StyleSheet.create({
  column: { paddingHorizontal: 16 },
  columnHeader: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  stage: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 18 },
  cards: { gap: spacing.md, paddingBottom: 130 },
  emptyState: { flex: 0, paddingVertical: 44 },
});
