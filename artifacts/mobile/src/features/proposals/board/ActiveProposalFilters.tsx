import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { BoardFilters } from '@/src/features/proposals/api';
import { UIChip } from '@/src/ui';
import { spacing } from '@/src/theme';

type RemovableFilter = 'search' | 'status' | 'createdByName' | 'proposalTypeName' | 'dateFrom' | 'dateTo';

export function ActiveProposalFilters({ search, filters, onRemove }: {
  search: string;
  filters: BoardFilters;
  onRemove: (key: RemovableFilter) => void;
}) {
  const items: Array<{ key: RemovableFilter; label: string }> = [];
  if (search.trim()) items.push({ key: 'search', label: `Busca: ${search.trim()}` });
  if (filters.status) items.push({ key: 'status', label: `Status: ${filters.status}` });
  if (filters.createdByName) items.push({ key: 'createdByName', label: `Responsável: ${filters.createdByName}` });
  if (filters.proposalTypeName) items.push({ key: 'proposalTypeName', label: `Tipo: ${filters.proposalTypeName}` });
  if (filters.dateFrom) items.push({ key: 'dateFrom', label: `De: ${filters.dateFrom}` });
  if (filters.dateTo) items.push({ key: 'dateTo', label: `Até: ${filters.dateTo}` });
  if (!items.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.content}>
      {items.map((item) => (
        <UIChip key={item.key} label={item.label} icon="x" onPress={() => onRemove(item.key)} accessibilityLabel={`Remover filtro ${item.label}`} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.sm, paddingHorizontal: 2 } });
