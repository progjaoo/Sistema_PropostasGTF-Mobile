import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { UIChip } from '@/src/ui';
import { spacing } from '@/src/theme';

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
          <UIChip
            key={step.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Etapa ${step.label}`}
            icon={step.icon}
            label={step.label}
            active={selected}
            style={styles.step}
            onPress={() => onChange(step.id)}
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.sm, paddingRight: spacing.lg },
  step: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
  },
});
