import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ProposalVersion } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { formatDateTime } from '@/src/utils/format';
import { UIBottomSheet, UIButton, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

interface Props {
  visible: boolean;
  version: ProposalVersion | null;
  loading: boolean;
  restoring: boolean;
  onClose: () => void;
  onRestore: () => void;
}

export function ProposalVersionSheet({ visible, version, loading, restoring, onClose, onRestore }: Props) {
  const colors = useColors();
  const snapshot = version?.snapshot as Record<string, unknown> | undefined;
  const advertiser = snapshot?.advertiser as { tradeName?: string } | undefined;
  const products = Array.isArray(snapshot?.products) ? snapshot.products : [];

  return (
    <UIBottomSheet visible={visible} onClose={onClose} style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>Versão da proposta</Text>
              {version && (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {formatDateTime(version.createdAt)}
                </Text>
              )}
            </View>
            <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Fechar versão">
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          {loading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Carregando snapshot...</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.content}>
              <Info label="Cliente" value={String(snapshot?.clientLine1 ?? advertiser?.tradeName ?? 'Sem cliente')} />
              <Info label="Tipo" value={String(snapshot?.propType ?? 'Sem tipo')} />
              <Info label="Status" value={String(snapshot?.status ?? 'Sem status')} />
              <Info label="Investimento" value={String(snapshot?.investValue ?? 'Sem valor')} />
              <Info label="Produtos" value={`${products.length} produto(s)`} />
              <UICard variant="muted" style={[styles.warning, { backgroundColor: colors.warning + '18' }]}>
                <Feather name="alert-triangle" size={17} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.foreground }]}>
                  Restaurar substitui os campos editáveis atuais pelo conteúdo salvo nesta versão.
                </Text>
              </UICard>
            </ScrollView>
          )}

          <UIButton
            disabled={!version || loading || restoring}
            size="lg"
            onPress={onRestore}
          >
            {restoring ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={styles.restoreText}>Restaurar esta versão</Text>}
          </UIButton>
    </UIBottomSheet>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <UICard variant="outlined" style={styles.info}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={2}>{value}</Text>
    </UICard>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '86%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  content: { gap: 10 },
  info: { gap: 3 },
  infoLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  warning: { flexDirection: 'row', gap: spacing.sm },
  warningText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  restoreText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
