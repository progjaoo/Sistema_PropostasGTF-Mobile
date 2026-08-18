import React, { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  PanResponder,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type PanResponderGestureState,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import { PROPOSAL_STAGES, type ProposalStageColumn } from './proposalBoardModel';
import { ProposalBoardCard, type ProposalBoardCardDensity } from './ProposalBoardCard';
import { getDragTargetIndex } from './proposalDragModel';
import type { ProposalTimelineStep } from '@/src/types';

export interface ProposalStageColumnViewProps {
  column: ProposalStageColumn;
  density: ProposalBoardCardDensity;
  refreshing: boolean;
  onRefresh?: () => void;
  onOpen: (proposal: ProgressBoardProposal) => void;
  onMove: (proposal: ProgressBoardProposal) => void;
  onDrop?: (proposal: ProgressBoardProposal, step: ProposalTimelineStep) => void;
  stageIndex?: number;
  stageCount?: number;
  stageWidth?: number;
}

export function ProposalStageColumnView({
  column,
  density,
  refreshing,
  onRefresh,
  onOpen,
  onMove,
  onDrop,
  stageIndex = 0,
  stageCount = 1,
  stageWidth = 320,
}: ProposalStageColumnViewProps) {
  const colors = useColors();
  return (
    <UICard
      variant="default"
      style={styles.stageCard}
      testID={`proposal-stage-card-${column.step}`}
    >
      <View style={styles.container} testID={`proposal-stage-${column.step}`}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{column.label}</Text>
          <UIBadge label={String(column.proposals.length)} variant={column.proposals.length ? 'info' : 'default'} size="sm" />
        </View>
        <FlatList
          data={column.proposals}
          keyExtractor={(proposal) => proposal.id}
          contentContainerStyle={styles.cards}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> : undefined}
          renderItem={({ item }) => (
            <DraggableProposalCard
              proposal={item}
              density={density}
              canMove={item.viewerCanEdit}
              stageIndex={stageIndex}
              stageCount={stageCount}
              stageWidth={stageWidth}
              onOpen={() => onOpen(item)}
              onMove={() => onMove(item)}
              onDrop={onDrop}
            />
          )}
        />
      </View>
    </UICard>
  );
}

type DraggableProposalCardProps = {
  proposal: ProgressBoardProposal;
  density: ProposalBoardCardDensity;
  canMove: boolean;
  stageIndex: number;
  stageCount: number;
  stageWidth: number;
  onOpen: () => void;
  onMove: () => void;
  onDrop?: (proposal: ProgressBoardProposal, step: ProposalTimelineStep) => void;
};

function DraggableProposalCard({
  proposal,
  density,
  canMove,
  stageIndex,
  stageCount,
  stageWidth,
  onOpen,
  onMove,
  onDrop,
}: DraggableProposalCardProps) {
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const translationRef = useRef(0);
  const [translationX, setTranslationX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const finishDrag = (gesture: PanResponderGestureState) => {
    const targetIndex = getDragTargetIndex(stageIndex, gesture.dx || translationRef.current, stageWidth, stageCount);
    draggingRef.current = false;
    translationRef.current = 0;
    setTranslationX(0);
    setDragging(false);
    if (targetIndex !== null && onDrop) {
      onDrop(proposal, targetIndex === stageIndex ? proposal.currentStep : getStepAtIndex(targetIndex));
    }
  };

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => draggingRef.current,
    onMoveShouldSetPanResponderCapture: () => draggingRef.current,
    onPanResponderMove: (_, gesture) => {
      if (!draggingRef.current) return;
      translationRef.current = gesture.dx;
      movedRef.current = true;
      setTranslationX(gesture.dx);
    },
    onPanResponderRelease: (_, gesture) => finishDrag(gesture),
    onPanResponderTerminate: (_, gesture) => finishDrag(gesture),
  }), [onDrop, proposal, stageCount, stageIndex, stageWidth]);

  return (
    <View
      {...responder.panHandlers}
      testID={`proposal-drag-target-${proposal.id}`}
      style={[styles.dragTarget, dragging && styles.dragging, dragging && { transform: [{ translateX: translationX }] }]}
    >
      <ProposalBoardCard
        proposal={proposal}
        density={density}
        canMove={canMove}
        onOpen={onOpen}
        onMove={onMove}
        delayLongPress={380}
        onLongPress={() => {
          if (!canMove || !onDrop || stageCount < 2) return;
          draggingRef.current = true;
          movedRef.current = false;
          translationRef.current = 0;
          setDragging(true);
        }}
        onLongPressEnd={() => {
          if (!movedRef.current) {
            draggingRef.current = false;
            setDragging(false);
          }
        }}
      />
    </View>
  );
}

function getStepAtIndex(index: number): ProposalTimelineStep {
  return PROPOSAL_STAGES[Math.max(0, Math.min(PROPOSAL_STAGES.length - 1, index))];
}

const styles = StyleSheet.create({
  stageCard: { flex: 1, minHeight: 260, minWidth: 0, overflow: 'visible' },
  container: { flex: 1, minWidth: 0, gap: spacing.sm },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { flex: 1, fontFamily: 'Inter_800ExtraBold', fontSize: 18 },
  cards: { gap: spacing.md, paddingBottom: 130 },
  dragTarget: { minWidth: 0 },
  dragging: { zIndex: 10, opacity: 0.86 },
});
