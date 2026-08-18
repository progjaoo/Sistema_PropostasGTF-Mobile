import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Advertiser } from '@/src/types';
import { ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { UIButton, TypedConfirmDialog } from '@/src/ui';
import { spacing } from '@/src/theme';

export function AdvertiserDeactivateAction({ advertiser, deactivate, pending = false, onSuccess }: { advertiser: Advertiser; deactivate: (id: string, confirmWithProposals?: boolean) => Promise<unknown>; pending?: boolean; onSuccess?: () => void }) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [confirmWithProposals, setConfirmWithProposals] = useState(false);
  const submit = async () => {
    try {
      await deactivate(advertiser.id, confirmWithProposals);
      setVisible(false);
      setConflictMessage(null);
      onSuccess?.();
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setConflictMessage(apiError?.status === 409 ? apiError.payload.message : apiError?.status === 403 || apiError?.status === 404 ? 'Cadastro não encontrado ou sem acesso.' : 'Não foi possível desativar o cadastro.');
      if (apiError?.payload.requiresConfirmation) setConfirmWithProposals(true);
    }
  };
  return <View style={styles.container}>{conflictMessage && <Text style={[styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">{conflictMessage}</Text>}<UIButton title="Excluir cadastro" variant="destructive" onPress={() => { setConflictMessage(null); setConfirmWithProposals(false); setVisible(true); }} disabled={pending} /><TypedConfirmDialog visible={visible} title="Desativar cadastro" resourceName={advertiser.tradeName} description={confirmWithProposals ? 'Este cadastro possui propostas vinculadas. Confirme novamente para desativá-lo; o histórico será preservado.' : 'A ação é uma desativação lógica. O histórico será preservado.'} confirmLabel="Desativar cadastro" pending={pending} onCancel={() => setVisible(false)} onConfirm={submit} /></View>;
}

const styles = StyleSheet.create({ container: { gap: spacing.sm }, error: { fontSize: 13, lineHeight: 18 }, });
