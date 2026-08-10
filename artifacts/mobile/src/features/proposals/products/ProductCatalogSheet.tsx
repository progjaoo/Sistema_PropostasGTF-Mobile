import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ProductTemplate } from '@/src/types';
import { useColors } from '@/hooks/useColors';

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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.title, { color: colors.foreground }]}>Adicionar produto</Text>
          <View style={[styles.search, { borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={search} onChangeText={setSearch} placeholder="Buscar no catalogo" placeholderTextColor={colors.mutedForeground} />
          </View>
          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
            {filtered.map((product) => (
              <TouchableOpacity key={product.id} style={[styles.row, { borderBottomColor: colors.border }]} onPress={() => onSelect(product)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: colors.foreground }]}>{product.title}</Text>
                  <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                    {[product.program, product.durationLabel, product.suggestedValue].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <Feather name="plus-circle" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={[styles.custom, { borderColor: colors.primary }]} onPress={onCreateCustom}>
            <Feather name="edit-3" size={16} color={colors.primary} />
            <Text style={[styles.customText, { color: colors.primary }]}>Criar produto novo nesta proposta</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  sheet: { maxHeight: '85%', padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  search: { minHeight: 46, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 },
  input: { flex: 1, fontFamily: 'Inter_400Regular' },
  results: { maxHeight: 420 },
  row: { minHeight: 62, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 3 },
  custom: { minHeight: 48, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  customText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

