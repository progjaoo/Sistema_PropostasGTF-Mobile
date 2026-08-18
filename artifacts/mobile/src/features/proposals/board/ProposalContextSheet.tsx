import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { UIBottomSheet, UIButton, UIChip, UIInput } from '@/src/ui';
import { spacing, tokens } from '@/src/theme';
import type { BoardGroupingMode } from './proposalBoardModel';

export type ProposalContextOption = {
  id: string;
  name: string;
  color?: string | null;
  count?: number;
  usesPrograms?: boolean;
};

export function ProposalContextSheet({
  visible,
  grouping,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  grouping: BoardGroupingMode;
  options: ProposalContextOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const noun = grouping === 'station' ? 'Empresa' : 'Programa';
  const filteredOptions = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('pt-BR');
    if (!needle) return options;
    return options.filter((option) => option.name.toLocaleLowerCase('pt-BR').includes(needle));
  }, [options, search]);

  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  return (
    <UIBottomSheet visible={visible} onClose={onClose} style={styles.sheet}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Selecionar {noun}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Escolha o contexto do Kanban.</Text>
        </View>
        <UIButton title="Fechar" variant="ghost" size="sm" onPress={onClose} accessibilityLabel={`Fechar seleção de ${noun}`} />
      </View>
      <UIInput
        leftIcon="search"
        placeholder={`Buscar ${noun}`}
        value={search}
        onChangeText={setSearch}
        accessibilityLabel={`Buscar ${noun}`}
      />
      <ScrollView contentContainerStyle={styles.options} keyboardShouldPersistTaps="handled">
        {filteredOptions.map((option) => (
          <UIChip
            key={option.id}
            label={option.count === undefined ? option.name : `${option.name} · ${option.count}`}
            active={option.id === selectedId}
            accessibilityLabel={option.name}
            accessibilityState={{ selected: option.id === selectedId }}
            onPress={() => { onSelect(option.id); onClose(); }}
            style={[styles.option, { borderLeftColor: option.color ?? colors.primary }]}
          />
        ))}
        {!filteredOptions.length && (
          <Text style={[styles.empty, { color: colors.mutedForeground }]}>Nenhuma {noun} encontrada</Text>
        )}
      </ScrollView>
    </UIBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '82%' },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 22 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 3 },
  options: { gap: spacing.sm, paddingBottom: spacing.md },
  option: { minHeight: 48, justifyContent: 'flex-start', borderLeftWidth: 4, borderRadius: tokens.radius.lg },
  empty: { textAlign: 'center', paddingVertical: spacing.xl, fontFamily: 'Inter_500Medium' },
});
