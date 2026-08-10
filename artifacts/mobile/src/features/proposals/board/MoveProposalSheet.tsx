import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ProposalTimelineStep } from '@/src/types';
import { TIMELINE_STEP_LABELS } from '@/src/utils/enums';
import { useColors } from '@/hooks/useColors';
import { showConfirm } from '@/components/ConfirmDialog';
import { UIBadge, UIBottomSheet, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

const STEPS: ProposalTimelineStep[] = [
  'IN_CONVERSATION',
  'PROPOSAL_SENT',
  'CLIENT_REVIEWING',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
];

export function MoveProposalSheet({
  visible,
  onClose,
  onSelect,
  pending,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (step: ProposalTimelineStep) => void;
  pending: boolean;
}) {
  const colors = useColors();
  const handleSelect = (step: ProposalTimelineStep) => {
    if (step === 'APPROVED' || step === 'REJECTED') {
      showConfirm({
        title: step === 'APPROVED' ? 'Aprovar proposta?' : 'Rejeitar proposta?',
        message:
          step === 'APPROVED'
            ? 'A proposta será marcada como aprovada e o lead vinculado será convertido em cliente.'
            : 'A proposta será marcada como rejeitada e poderá gerar avisos de recaptura.',
        confirmText: step === 'APPROVED' ? 'Aprovada' : 'Rejeitar',
        destructive: step === 'REJECTED',
        onConfirm: () => onSelect(step),
      });
      return;
    }

    onSelect(step);
  };

  return (
    <UIBottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mover para etapa</Text>
        {pending ? <UIBadge label="Salvando" variant="info" size="sm" /> : null}
      </View>
      <View style={styles.options}>
        {STEPS.map((step) => (
          <UICard
            key={step}
            variant={step === 'APPROVED' ? 'muted' : 'default'}
            disabled={pending}
            style={[
              styles.option,
              step === 'APPROVED' && { borderColor: colors.success },
              step === 'REJECTED' && { borderColor: colors.destructive },
            ]}
            onPress={() => handleSelect(step)}
          >
            <Text
              style={[
                styles.optionText,
                { color: colors.foreground },
                step === 'APPROVED' && { color: colors.success },
                step === 'REJECTED' && { color: colors.destructive },
              ]}
            >
              {step === 'APPROVED' ? 'Aprovada' : TIMELINE_STEP_LABELS[step]}
            </Text>
          </UICard>
        ))}
      </View>
    </UIBottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 22 },
  options: { gap: spacing.sm },
  option: { minHeight: 54, justifyContent: 'center' },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 16 },
});
