import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { UIBottomSheet, UIButton, UIChip, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';
import type { RecallAlertFilterState } from './recallAlertFilters';

type Props = {
  value: RecallAlertFilterState;
  resultCount: number;
  onChange: (value: RecallAlertFilterState) => void;
};

const milestones = [3, 6, 10] as const;

export function RecallAlertFilterBar({ value, resultCount, onChange }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const activeCount = [value.status && value.status !== 'ALL', value.milestone && value.milestone !== 'ALL'].filter(Boolean).length;

  return (
    <View style={[styles.root, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
      <View style={styles.searchRow}>
        <UIInput
          testID="recall-alert-search"
          leftIcon="search"
          rightIcon={value.search ? 'x' : undefined}
          onRightIconPress={() => onChange({ ...value, search: '' })}
          placeholder="Buscar cliente ou empresa"
          value={value.search ?? ''}
          onChangeText={(search) => onChange({ ...value, search })}
          containerStyle={styles.search}
        />
        <UIButton
          testID="recall-alert-filter-button"
          variant="outline"
          size="sm"
          iconLeft="sliders"
          title={activeCount ? `Filtros (${activeCount})` : 'Filtros'}
          onPress={() => setOpen(true)}
          style={styles.filterButton}
        />
      </View>
      <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>{resultCount} {resultCount === 1 ? 'aviso' : 'avisos'}</Text>
      <UIBottomSheet visible={open} onClose={() => setOpen(false)} testID="recall-alert-filter-sheet">
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Filtrar avisos</Text>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Status</Text>
          <View style={styles.chips}>
            {([
              ['ALL', 'Todos'],
              ['PENDING', 'Pendentes'],
              ['DONE', 'Tratados'],
            ] as const).map(([status, label]) => (
              <UIChip
                key={status}
                label={label}
                active={(value.status ?? 'ALL') === status}
                onPress={() => onChange({ ...value, status })}
              />
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>Momento da recaptura</Text>
          <View style={styles.chips}>
            <UIChip label="Todos" active={!value.milestone || value.milestone === 'ALL'} onPress={() => onChange({ ...value, milestone: 'ALL' })} />
            {milestones.map((milestone) => (
              <UIChip key={milestone} label={`${milestone} meses`} active={value.milestone === milestone} onPress={() => onChange({ ...value, milestone })} />
            ))}
          </View>
        </View>
        <View style={styles.sheetActions}>
          <UIButton title="Limpar filtros" variant="ghost" onPress={() => onChange({ search: '' })} />
          <UIButton title="Aplicar" onPress={() => setOpen(false)} style={styles.applyButton} />
        </View>
      </UIBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, gap: spacing.xs },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  search: { flex: 1 },
  filterButton: { minWidth: 104 },
  resultCount: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  sheetTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold' },
  section: { gap: spacing.sm },
  label: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sheetActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  applyButton: { minWidth: 112 },
});
