import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { LeadSource } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { UIBottomSheet, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

interface Props {
  sources: LeadSource[];
  value: string | null;
  onChange: (id: string) => void;
  error?: string;
}

export function LeadSourcePicker({ sources, value, onChange, error }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = sources.find((source) => source.id === value);

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.foreground }]}>Origem do Lead *</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Selecionar origem do Lead"
        style={[styles.trigger, { borderColor: error ? colors.destructive : colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}
      >
        <Text style={{ color: selected ? colors.foreground : colors.mutedForeground }}>
          {selected?.name ?? 'Selecione a origem'}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
      </Pressable>
      {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
      <UIBottomSheet visible={open} onClose={() => setOpen(false)}>
            <Text style={[styles.title, { color: colors.foreground }]}>Origem do Lead</Text>
            {sources.map((source) => (
              <UICard
                key={source.id}
                variant={source.id === value ? 'muted' : 'default'}
                style={styles.option}
                onPress={() => {
                  onChange(source.id);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, { color: colors.foreground }]}>{source.name}</Text>
                {source.id === value && <Feather name="check" size={20} color={colors.primary} />}
              </UICard>
            ))}
      </UIBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  trigger: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  error: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: spacing.sm },
  option: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 16 },
});
