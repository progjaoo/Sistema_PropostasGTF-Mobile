import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ProductTemplate } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIBottomSheet, UIButton, UICard, UIEmptyState, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

export function ProductCatalogSheet({
  visible,
  products,
  onClose,
  onSelect,
  onCreateCustom,
}: {
  visible: boolean;
  products: ProductTemplate[];
  onClose: () => void;
  onSelect: (product: ProductTemplate) => void;
  onCreateCustom: () => void;
}) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const filtered = products.filter((product) => `${product.title} ${product.program ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <UIBottomSheet visible={visible} onClose={onClose} style={styles.sheet}>
      <Text style={[styles.title, { color: colors.foreground }]}>Adicionar produto</Text>
      <UIInput
        leftIcon="search"
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar no catálogo"
        returnKeyType="search"
      />
      <ScrollView style={styles.results} contentContainerStyle={styles.resultsContent} keyboardShouldPersistTaps="handled">
        {filtered.length ? filtered.map((product) => (
          <UICard key={product.id} variant="default" style={styles.row} onPress={() => onSelect(product)}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.foreground }]}>{product.title}</Text>
              <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                {[product.program, product.durationLabel, product.suggestedValue].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Feather name="plus-circle" size={20} color={colors.primary} />
          </UICard>
        )) : (
          <UIEmptyState
            icon="package"
            title="Nenhum produto"
            description="Nenhum produto encontrado no catálogo."
            style={styles.empty}
          />
        )}
      </ScrollView>
      <UIButton
        variant="outline"
        iconLeft="edit-3"
        title="Criar produto novo nesta proposta"
        onPress={onCreateCustom}
      />
    </UIBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '85%' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 22 },
  results: { maxHeight: 420 },
  resultsContent: { gap: spacing.sm },
  row: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  empty: { flex: 0, paddingVertical: spacing.xl },
});
