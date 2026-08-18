import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { BoardFilters } from '@/src/features/proposals/api';
import { useColors } from '@/hooks/useColors';
import { PROPOSAL_STATUS_LABELS } from '@/src/utils/enums';
import type { ProposalStatus, UserRole } from '@/src/types';
import { UIBottomSheet, UIButton, UIChip, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';
import { isValidIsoBoardDate } from './proposalBoardModel';

const STATUSES: Array<{ value: ProposalStatus; label: string }> = [
  { value: 'DRAFT', label: PROPOSAL_STATUS_LABELS.DRAFT },
  { value: 'SENT', label: PROPOSAL_STATUS_LABELS.SENT },
  { value: 'APPROVED', label: PROPOSAL_STATUS_LABELS.APPROVED },
  { value: 'REJECTED', label: PROPOSAL_STATUS_LABELS.REJECTED },
];

interface Props {
  visible: boolean;
  filters: BoardFilters;
  /** @deprecated Context selection now lives in ProposalContextSheet. */
  programs?: Array<{ id: string; name: string; stationId?: string | null; stationName?: string | null }>;
  role?: UserRole;
  onClose: () => void;
  onApply: (filters: BoardFilters) => void;
  onClear: () => void;
}

export function ProposalFiltersSheet({ visible, filters, role = 'ADMIN', onClose, onApply, onClear }: Props) {
  const colors = useColors();
  const [draft, setDraft] = useState<BoardFilters>(filters);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setDateError(null);
    }
  }, [filters, visible]);

  const apply = () => {
    const invalidStart = draft.dateFrom && !isValidIsoBoardDate(draft.dateFrom);
    const invalidEnd = draft.dateTo && !isValidIsoBoardDate(draft.dateTo);
    if (invalidStart || invalidEnd || (draft.dateFrom && draft.dateTo && draft.dateFrom > draft.dateTo)) {
      setDateError('Use o formato AAAA-MM-DD.');
      return;
    }
    setDateError(null);
    onApply(draft);
    onClose();
  };

  return (
    <UIBottomSheet visible={visible} onClose={onClose} style={styles.sheet}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Filtros avançados</Text>
        <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Fechar filtros">
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FilterGroup title="Status">
          <View style={styles.chips}>
            <FilterChip label="Todos" selected={!draft.status} onPress={() => setDraft({ ...draft, status: undefined })} />
            {STATUSES.map((status) => (
              <FilterChip key={status.value} label={status.label} selected={draft.status === status.value} onPress={() => setDraft({ ...draft, status: status.value })} />
            ))}
          </View>
        </FilterGroup>
        <FilterGroup title="Detalhes">
          {role === 'ADMIN' && (
            <UIInput placeholder="Responsável" value={draft.createdByName ?? ''} onChangeText={(value) => setDraft({ ...draft, createdByName: value || undefined })} />
          )}
          <UIInput placeholder="Tipo de proposta" value={draft.proposalTypeName ?? ''} onChangeText={(value) => setDraft({ ...draft, proposalTypeName: value || undefined })} />
          <View style={styles.dateRow}>
            <UIInput containerStyle={styles.dateInput} placeholder="Data inicial (AAAA-MM-DD)" value={draft.dateFrom ?? ''} onChangeText={(value) => { setDateError(null); setDraft({ ...draft, dateFrom: value || undefined }); }} />
            <UIInput containerStyle={styles.dateInput} placeholder="Data final (AAAA-MM-DD)" value={draft.dateTo ?? ''} onChangeText={(value) => { setDateError(null); setDraft({ ...draft, dateTo: value || undefined }); }} />
          </View>
          {dateError && <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">{dateError}</Text>}
        </FilterGroup>
      </ScrollView>
      <View style={styles.actions}>
        <UIButton title="Limpar" variant="outline" style={styles.secondary} onPress={() => { setDateError(null); onClear(); onClose(); }} />
        <UIButton title="Aplicar filtros" style={styles.primary} onPress={apply} />
      </View>
    </UIBottomSheet>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const colors = useColors();
  return <View style={styles.group}><Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>{title}</Text>{children}</View>;
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return <UIChip label={label} active={selected} onPress={onPress} style={styles.chip} accessibilityState={{ selected }} />;
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
  error: { fontSize: 12, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 10 },
  secondary: { flex: 1 },
  primary: { flex: 1.4 },
});
