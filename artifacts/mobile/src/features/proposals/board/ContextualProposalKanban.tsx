import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, tokens } from '@/src/theme';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import type { ProposalTimelineStep } from '@/src/types';
import type { BoardDensityMode, ProposalStageColumn } from './proposalBoardModel';
import { getFirstPopulatedStageIndex } from './proposalBoardModel';
import { ProposalStageColumnView } from './ProposalStageColumn';

export interface ContextualProposalKanbanProps {
  density: BoardDensityMode;
  columns: ProposalStageColumn[];
  contextKey: string;
  refreshing: boolean;
  onRefresh?: () => void;
  onOpen: (proposal: ProgressBoardProposal) => void;
  onMove: (proposal: ProgressBoardProposal) => void;
  onDrop?: (proposal: ProgressBoardProposal, step: ProposalTimelineStep) => void;
}

export function getProposalColumnWidth(viewportWidth: number, density: BoardDensityMode) {
  if (density === 'focused') return Math.max(288, viewportWidth - 32);
  return Math.min(360, Math.max(220, Math.round(viewportWidth * 0.58)));
}

export function ContextualProposalKanban({
  density,
  columns,
  contextKey,
  refreshing,
  onRefresh,
  onOpen,
  onMove,
  onDrop,
}: ContextualProposalKanbanProps) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const focusedRef = useRef<FlatList<ProposalStageColumn>>(null);
  const [activeIndex, setActiveIndex] = useState(() => getFirstPopulatedStageIndex(columns));
  const columnWidth = getProposalColumnWidth(width, density);
  const pageWidth = density === 'focused' ? Math.max(width, columnWidth + spacing.lg * 2) : columnWidth;
  const firstPopulatedIndex = useMemo(() => getFirstPopulatedStageIndex(columns), [columns]);

  useEffect(() => {
    setActiveIndex(firstPopulatedIndex);
  }, [contextKey, firstPopulatedIndex]);

  useEffect(() => {
    if (density !== 'focused') return;
    const frame = requestAnimationFrame(() => {
      focusedRef.current?.scrollToIndex({ index: firstPopulatedIndex, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [contextKey, density, firstPopulatedIndex]);

  if (density === 'overview') {
    return (
      <View testID="proposal-kanban-overview" style={styles.root}>
        <FlatList
          horizontal
          data={columns}
          keyExtractor={(column) => column.step}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.overviewContent}
          ItemSeparatorComponent={() => <View style={styles.columnGap} />}
          renderItem={({ item, index }) => (
            <View style={{ width: columnWidth }}>
              <ProposalStageColumnView
                column={item}
                density="compact"
                refreshing={refreshing}
                onRefresh={onRefresh}
                onOpen={onOpen}
                onMove={onMove}
                onDrop={onDrop}
                stageIndex={index}
                stageCount={columns.length}
                stageWidth={columnWidth}
              />
            </View>
          )}
          ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>Nenhuma etapa disponível.</Text>}
        />
      </View>
    );
  }

  return (
    <View testID="proposal-kanban-focused" style={styles.root}>
      <FlatList
        ref={focusedRef}
        horizontal
        pagingEnabled
        data={columns}
        keyExtractor={(column) => column.step}
        showsHorizontalScrollIndicator={false}
        snapToInterval={pageWidth}
        decelerationRate="fast"
        initialScrollIndex={firstPopulatedIndex}
        getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        onScrollToIndexFailed={() => setActiveIndex(firstPopulatedIndex)}
        onMomentumScrollEnd={(event) => setActiveIndex(getIndexFromScroll(event, pageWidth, columns.length))}
        renderItem={({ item, index }) => (
          <View testID={index === firstPopulatedIndex ? 'proposal-kanban-focused-page' : `proposal-kanban-focused-page-${item.step}`} style={[styles.focusedPage, { width: pageWidth }]}>
            <View testID="proposal-kanban-focused-column" style={[styles.focusedColumn, { width: columnWidth }]}>
              <ProposalStageColumnView
                column={item}
                density="comfortable"
                refreshing={refreshing}
                onRefresh={onRefresh}
                onOpen={onOpen}
                onMove={onMove}
                onDrop={onDrop}
                stageIndex={index}
                stageCount={columns.length}
                stageWidth={columnWidth}
              />
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.mutedForeground }]}>Nenhuma etapa disponível.</Text>}
      />
      <View testID="proposal-kanban-pagination" style={[styles.pagination, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {columns.map((column, index) => (
          <Pressable
            key={column.step}
            accessibilityRole="button"
            accessibilityLabel={`Etapa ${index + 1} de ${columns.length}: ${column.label}`}
            accessibilityState={{ selected: activeIndex === index }}
            onPress={() => {
              setActiveIndex(index);
              focusedRef.current?.scrollToIndex({ index, animated: true });
            }}
            style={[styles.dot, { backgroundColor: activeIndex === index ? colors.primary : colors.border }]}
          />
        ))}
      </View>
    </View>
  );
}

function getIndexFromScroll(
  event: NativeSyntheticEvent<NativeScrollEvent>,
  columnWidth: number,
  count: number,
) {
  if (!columnWidth || !count) return 0;
  return Math.max(0, Math.min(count - 1, Math.round(event.nativeEvent.contentOffset.x / columnWidth)));
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  focusedPage: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  focusedColumn: { flex: 1, minWidth: 0 },
  overviewContent: { paddingHorizontal: spacing.lg, paddingBottom: 130 },
  columnGap: { width: spacing.md },
  empty: { padding: spacing.xl, textAlign: 'center' },
  pagination: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: tokens.radius.full,
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
