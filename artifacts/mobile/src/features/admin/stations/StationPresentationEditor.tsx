import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FormInput } from '@/components/FormInput';
import type { StationPresentationItem } from '@/src/types';
import { useColors } from '@/hooks/useColors';

export function StationPresentationEditor({
  items,
  onChange,
}: {
  items: StationPresentationItem[];
  onChange: (items: StationPresentationItem[]) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      {items.map((item, index) => (
        <View key={index} style={[styles.item, { borderColor: colors.border }]}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: colors.foreground }]}>Indicador {index + 1}</Text>
            <TouchableOpacity
              accessibilityLabel={`Remover indicador ${index + 1}`}
              onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index).map((value, order) => ({ ...value, order })))}
            >
              <Feather name="trash-2" size={18} color={colors.destructive} />
            </TouchableOpacity>
          </View>
          <FormInput label="Destaque" placeholder="Ex: 34,5%" value={item.highlight} onChangeText={(highlight) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, highlight } : value))} />
          <FormInput label="Descricao" placeholder="Ex: Audiencia mensal" value={item.description} onChangeText={(description) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, description } : value))} />
        </View>
      ))}
      {items.length < 4 && (
        <TouchableOpacity style={[styles.add, { borderColor: colors.primary }]} onPress={() => onChange([...items, { highlight: '', description: '', order: items.length }])}>
          <Feather name="plus" size={16} color={colors.primary} />
          <Text style={[styles.addText, { color: colors.primary }]}>Adicionar indicador</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  item: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 10 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  add: { minHeight: 46, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
});

