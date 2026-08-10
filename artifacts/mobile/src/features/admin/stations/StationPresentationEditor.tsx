import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import type { StationPresentationItem } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIButton, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

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
        <UICard key={index} variant="outlined" style={styles.item}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: colors.foreground }]}>Indicador {index + 1}</Text>
            <UIButton
              variant="ghost"
              iconLeft="trash-2"
              size="sm"
              accessibilityLabel={`Remover indicador ${index + 1}`}
              onPress={() => onChange(items.filter((_, itemIndex) => itemIndex !== index).map((value, order) => ({ ...value, order })))}
              style={styles.removeButton}
              iconColor={colors.destructive}
              textStyle={{ color: colors.destructive }}
            />
          </View>
          <FormInput label="Destaque" placeholder="Ex: 34,5%" value={item.highlight} onChangeText={(highlight) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, highlight } : value))} />
          <FormInput label="Descricao" placeholder="Ex: Audiencia mensal" value={item.description} onChangeText={(description) => onChange(items.map((value, itemIndex) => itemIndex === index ? { ...value, description } : value))} />
        </UICard>
      ))}
      {items.length < 4 && (
        <UIButton
          variant="outline"
          iconLeft="plus"
          title="Adicionar indicador"
          onPress={() => onChange([...items, { highlight: '', description: '', order: items.length }])}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  item: { gap: spacing.sm },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  removeButton: { borderColor: 'transparent', minWidth: 44 },
});
