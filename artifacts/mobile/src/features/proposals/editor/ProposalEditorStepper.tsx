import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export type ProposalEditorStep = 'context' | 'period' | 'products' | 'investment' | 'review';

const STEPS: Array<{ id: ProposalEditorStep; label: string; icon: keyof typeof Feather.glyphMap }> = [
  { id: 'context', label: 'Contexto', icon: 'file-text' },
  { id: 'period', label: 'Período', icon: 'calendar' },
  { id: 'products', label: 'Produtos', icon: 'package' },
  { id: 'investment', label: 'Investimento', icon: 'dollar-sign' },
  { id: 'review', label: 'Revisão', icon: 'check-square' },
];

export function ProposalEditorStepper({
  value,
  onChange,
}: {
  value: ProposalEditorStep;
  onChange: (step: ProposalEditorStep) => void;
}) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityRole="tablist"
    >
      {STEPS.map((step) => {
        const selected = value === step.id;
        return (
          <TouchableOpacity
            key={step.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Etapa ${step.label}`}
            style={[
              styles.step,
              { borderColor: selected ? colors.primary : colors.border },
              selected && { backgroundColor: colors.primary },
            ]}
            onPress={() => onChange(step.id)}
          >
            <Feather name={step.icon} size={15} color={selected ? '#FFF' : colors.mutedForeground} />
            <Text style={[styles.label, { color: selected ? '#FFF' : colors.foreground }]}>{step.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: 8, paddingRight: 16 },
  step: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
});
