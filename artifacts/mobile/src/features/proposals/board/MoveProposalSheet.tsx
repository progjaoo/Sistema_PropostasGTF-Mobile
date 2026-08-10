import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { ProposalTimelineStep } from '@/src/types';
import { TIMELINE_STEP_LABELS } from '@/src/utils/enums';
import { useColors } from '@/hooks/useColors';
import { showConfirm } from '@/components/ConfirmDialog';

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
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.title, { color: colors.foreground }]}>Mover para etapa</Text>
          {STEPS.map((step) => (
            <TouchableOpacity
              key={step}
              disabled={pending}
              style={[styles.option, { borderBottomColor: colors.border }]}
              onPress={() => handleSelect(step)}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: colors.foreground },
                  step === 'APPROVED' && styles.approved,
                  step === 'REJECTED' && styles.rejected,
                ]}
              >
                {step === 'APPROVED' ? 'Aprovada' : TIMELINE_STEP_LABELS[step]}
              </Text>
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, marginBottom: 12 },
  option: { minHeight: 52, justifyContent: 'center', borderBottomWidth: 1 },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  approved: { color: '#16A34A' },
  rejected: { color: '#DC2626' },
});
