import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BoardFilters } from '@/src/features/proposals/api';
import { useColors } from '@/hooks/useColors';
import { PROPOSAL_STATUS_LABELS } from '@/src/utils/enums';
import type { ProposalStatus } from '@/src/types';

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
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Filtros</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
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
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="Responsavel"
                placeholderTextColor={colors.mutedForeground}
                value={draft.createdByName ?? ''}
                onChangeText={(value) => setDraft({ ...draft, createdByName: value || undefined })}
              />
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="Tipo de proposta"
                placeholderTextColor={colors.mutedForeground}
                value={draft.proposalTypeName ?? ''}
                onChangeText={(value) => setDraft({ ...draft, proposalTypeName: value || undefined })}
              />
              <View style={styles.dateRow}>
                <TextInput
                  style={[styles.input, styles.dateInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Data inicial"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.dateFrom ?? ''}
                  onChangeText={(value) => setDraft({ ...draft, dateFrom: value || undefined })}
                />
                <TextInput
                  style={[styles.input, styles.dateInput, { borderColor: colors.border, color: colors.foreground }]}
                  placeholder="Data final"
                  placeholderTextColor={colors.mutedForeground}
                  value={draft.dateTo ?? ''}
                  onChangeText={(value) => setDraft({ ...draft, dateTo: value || undefined })}
                />
              </View>
            </FilterGroup>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondary, { borderColor: colors.border }]}
              onPress={() => {
                onClear();
                onClose();
              }}
            >
              <Text style={[styles.secondaryText, { color: colors.foreground }]}>Limpar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primary, { backgroundColor: colors.primary }]}
              onPress={() => {
                onApply(draft);
                onClose();
              }}
            >
              <Text style={styles.primaryText}>Aplicar filtros</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.chip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : 'transparent' }]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: selected ? '#FFF' : colors.foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  content: { gap: 18 },
  group: { gap: 9 },
  groupTitle: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { maxWidth: 190, minHeight: 38, borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: 'Inter_400Regular' },
  dateRow: { flexDirection: 'row', gap: 8 },
  dateInput: { flex: 1 },
  actions: { flexDirection: 'row', gap: 10 },
  secondary: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  primary: { flex: 1.4, minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 14 },
});
