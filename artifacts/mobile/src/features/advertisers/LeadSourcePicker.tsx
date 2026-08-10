import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { LeadSource } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';

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
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Selecionar origem do Lead"
        style={[styles.trigger, { borderColor: error ? colors.destructive : colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}
      >
        <Text style={{ color: selected ? colors.foreground : colors.mutedForeground }}>
          {selected?.name ?? 'Selecione a origem'}
        </Text>
        <Feather name="chevron-down" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>
      {!!error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.title, { color: colors.foreground }]}>Origem do Lead</Text>
            {sources.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={() => {
                  onChange(source.id);
                  setOpen(false);
                }}
              >
                <Text style={[styles.optionText, { color: colors.foreground }]}>{source.name}</Text>
                {source.id === value && <Feather name="check" size={20} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 12 },
  option: { minHeight: 52, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 16 },
});
