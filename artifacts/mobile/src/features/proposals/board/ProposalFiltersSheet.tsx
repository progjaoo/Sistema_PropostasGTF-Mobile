import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BoardFilters } from '@/src/features/proposals/api';
import { useColors } from '@/hooks/useColors';
import { PROPOSAL_STATUS_LABELS } from '@/src/utils/enums';
import type { ProposalStatus } from '@/src/types';
import { UIBottomSheet, UIButton, UIChip, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

const STATUSES: Array<{ value: ProposalStatus; label: string }> = [
  { value: 'DRAFT', label: PROPOSAL_STATUS_LABELS.DRAFT },
  { value: 'SENT', label: PROPOSAL_STATUS_LABELS.SENT },
  { value: 'APPROVED', label: PROPOSAL_STATUS_LABELS.APPROVED },
  { value: 'REJECTED', label: PROPOSAL_STATUS_LABELS.REJECTED },
];

interface Props {
  visible: boolean;
  filters: BoardFilters;
  programs: Array<{ id: string; name: string; stationId?: string | null; stationName?: string | null }>;
  onClose: () => void;
  onApply: (filters: BoardFilters) => void;
  onClear: () => void;
}

export function ProposalFiltersSheet({ visible, filters, programs, onClose, onApply, onClear }: Props) {
  const colors = useColors();
  const [draft, setDraft] = useState<BoardFilters>(filters);
  const stations = Array.from(
    new Map(
      programs
        .filter((program) => program.stationId && program.stationName)
        .map((program) => [program.stationId!, { id: program.stationId!, name: program.stationName! }]),
    ).values(),
  );

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  return (
    <UIBottomSheet visible={visible} onClose={onClose} style={styles.sheet}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Filtros</Text>
        <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Fechar filtros">
              <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FilterGroup title="Status">
          <View style={styles.chips}>
            <FilterChip label="Todos" selected={!draft.status} onPress={() => setDraft({ ...draft, status: undefined })} />
            {STATUSES.map((status) => (
              <FilterChip
                key={status.value}
                label={status.label}
                selected={draft.status === status.value}
                onPress={() => setDraft({ ...draft, status: status.value })}
              />
            ))}
          </View>
        </FilterGroup>

            <FilterGroup title="Empresa">
              <View style={styles.chips}>
                <FilterChip label="Todas" selected={!draft.stationId} onPress={() => setDraft({ ...draft, stationId: undefined })} />
                {stations.map((station) => (
                  <FilterChip
                    key={station.id}
                    label={station.name}
                    selected={draft.stationId === station.id}
                    onPress={() => setDraft({ ...draft, stationId: station.id })}
                  />
                ))}
              </View>
            </FilterGroup>

            <FilterGroup title="Programa">
              <View style={styles.chips}>
                <FilterChip label="Todos" selected={!draft.programId} onPress={() => setDraft({ ...draft, programId: undefined })} />
                {programs.map((program) => (
                  <FilterChip
                    key={program.id}
                    label={program.name}
                    selected={draft.programId === program.id}
                    onPress={() => setDraft({ ...draft, programId: program.id })}
                  />
                ))}
              </View>
            </FilterGroup>

        <FilterGroup title="Filtro local">
          <UIInput
            placeholder="Responsável"
            value={draft.createdByName ?? ''}
            onChangeText={(value) => setDraft({ ...draft, createdByName: value || undefined })}
          />
          <UIInput
            placeholder="Tipo de proposta"
            value={draft.proposalTypeName ?? ''}
            onChangeText={(value) => setDraft({ ...draft, proposalTypeName: value || undefined })}
          />
          <View style={styles.dateRow}>
            <UIInput
              containerStyle={styles.dateInput}
              placeholder="Data inicial"
              value={draft.dateFrom ?? ''}
              onChangeText={(value) => setDraft({ ...draft, dateFrom: value || undefined })}
            />
            <UIInput
              containerStyle={styles.dateInput}
              placeholder="Data final"
              value={draft.dateTo ?? ''}
              onChangeText={(value) => setDraft({ ...draft, dateTo: value || undefined })}
            />
          </View>
        </FilterGroup>
      </ScrollView>
      <View style={styles.actions}>
        <UIButton
          title="Limpar"
          variant="outline"
          style={styles.secondary}
          onPress={() => {
            onClear();
            onClose();
          }}
        />
        <UIButton
          title="Aplicar filtros"
          style={styles.primary}
          onPress={() => {
            onApply(draft);
            onClose();
          }}
        />
      </View>
    </UIBottomSheet>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{title}</Text>
      {children}
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <UIChip label={label} active={selected} onPress={onPress} style={styles.chip} />;
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 22 },
  content: { gap: 18, paddingBottom: spacing.md },
  group: { gap: 9 },
  groupTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { maxWidth: 190 },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  secondary: { flex: 1 },
  primary: { flex: 1.4 },
});
