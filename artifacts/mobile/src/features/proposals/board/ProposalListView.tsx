import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { ProposalProgressBoard, ProgressBoardProposal } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { TIMELINE_STEP_LABELS } from '@/src/utils/enums';
import { ProposalBoardCard } from './ProposalBoardCard';
import { MoveProposalSheet } from './MoveProposalSheet';

interface Props {
  board: ProposalProgressBoard;
  refreshing: boolean;
  moving: boolean;
  onRefresh: () => void;
  onMove: (proposalId: string, step: ProgressBoardProposal['currentStep']) => void;
}

export function ProposalListView({ board, refreshing, moving, onRefresh, onMove }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<ProgressBoardProposal | null>(null);
  const proposals = dedupeProposals(
    board.programs.flatMap((program) =>
      program.proposals.map((proposal) => ({
        ...proposal,
        programName: program.name,
      })),
    ),
  );

  return (
    <>
      <FlatList
        data={proposals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.context}>
              <Text style={[styles.program, { color: colors.primary }]}>{item.programName}</Text>
              <Text style={[styles.step, { color: colors.mutedForeground }]}>{TIMELINE_STEP_LABELS[item.currentStep]}</Text>
            </View>
            <ProposalBoardCard
              proposal={item}
              onOpen={() => router.push(`/proposal/${item.id}`)}
              onMove={() => setSelected(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>Nenhuma proposta encontrada.</Text>
        }
      />
      <MoveProposalSheet
        visible={!!selected}
        pending={moving}
        onClose={() => setSelected(null)}
        onSelect={(step) => {
          if (!selected) return;
          onMove(selected.id, step);
          setSelected(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 12, paddingBottom: 120 },
  item: { gap: 8 },
  context: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  program: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  step: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  empty: { paddingVertical: 44, textAlign: 'center', fontFamily: 'Inter_400Regular' },
});

function dedupeProposals<T extends ProgressBoardProposal>(proposals: Array<T & { programName: string }>) {
  const byId = new Map<string, T & { programName: string }>();
  proposals.forEach((proposal) => {
    if (!byId.has(proposal.id)) {
      byId.set(proposal.id, proposal);
      return;
    }

    const current = byId.get(proposal.id)!;
    const programNames = new Set([
      ...current.programName.split(',').map((name) => name.trim()).filter(Boolean),
      proposal.programName,
    ]);
    byId.set(proposal.id, {
      ...current,
      programName: Array.from(programNames).join(', '),
    });
  });
  return Array.from(byId.values());
}
