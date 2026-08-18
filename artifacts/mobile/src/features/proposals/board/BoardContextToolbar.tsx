import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { UIButton, UIChip } from '@/src/ui';
import { spacing, tokens } from '@/src/theme';
import type { BoardDensityMode, BoardGroupingMode } from './proposalBoardModel';

export interface BoardContextToolbarProps {
  grouping: BoardGroupingMode;
  density: BoardDensityMode;
  contextLabel: string;
  activeFilterCount: number;
  onGroupingChange: (mode: BoardGroupingMode) => void;
  onOpenContext: () => void;
  onOpenSearch: () => void;
  onToggleDensity: () => void;
}

export function BoardContextToolbar({
  grouping,
  density,
  contextLabel,
  activeFilterCount,
  onGroupingChange,
  onOpenContext,
  onOpenSearch,
  onToggleDensity,
}: BoardContextToolbarProps) {
  const colors = useColors();
  const densityLabel = density === 'focused'
    ? 'Expandir colunas do Kanban'
    : 'Recolher para uma coluna por vez';

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.topRow}>
        <View style={[styles.segment, { borderColor: colors.border, backgroundColor: colors.muted }]} accessibilityRole="tablist">
          <UIChip
            label="Empresa"
            active={grouping === 'station'}
            accessibilityRole="tab"
            accessibilityState={{ selected: grouping === 'station' }}
            onPress={() => onGroupingChange('station')}
            style={styles.segmentChip}
          />
          <UIChip
            label="Programa"
            active={grouping === 'program'}
            accessibilityRole="tab"
            accessibilityState={{ selected: grouping === 'program' }}
            onPress={() => onGroupingChange('program')}
            style={styles.segmentChip}
          />
        </View>
        <UIButton
          title={contextLabel}
          variant="outline"
          size="sm"
          iconRight="chevron-down"
          onPress={onOpenContext}
          accessibilityLabel={`Selecionar ${grouping === 'station' ? 'Empresa' : 'Programa'}: ${contextLabel}`}
          style={styles.contextButton}
        />
      </View>
      <View style={styles.actions}>
        <UIButton
          title={activeFilterCount ? `Filtros (${activeFilterCount})` : 'Buscar e filtrar'}
          variant="outline"
          size="sm"
          iconLeft="search"
          onPress={onOpenSearch}
          accessibilityLabel="Buscar e filtrar propostas"
          style={styles.actionButton}
        />
        <UIButton
          variant="outline"
          size="sm"
          iconLeft={density === 'focused' ? 'maximize-2' : 'minimize-2'}
          onPress={onToggleDensity}
          accessibilityLabel={densityLabel}
          style={styles.iconButton}
        />
      </View>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        {density === 'focused' ? 'Uma etapa por vez' : 'Visão geral das etapas'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, padding: spacing.sm, borderWidth: 1, borderRadius: tokens.radius.xl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  segment: { flexDirection: 'row', padding: 3, borderWidth: 1, borderRadius: tokens.radius.full },
  segmentChip: { minHeight: 36, paddingHorizontal: spacing.sm },
  contextButton: { flex: 1, minWidth: 0 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: { flex: 1 },
  iconButton: { width: 46, paddingHorizontal: 0 },
  hint: { fontSize: 11, fontFamily: 'Inter_500Medium', paddingHorizontal: 2 },
});
