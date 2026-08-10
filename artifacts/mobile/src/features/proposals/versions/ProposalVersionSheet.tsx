import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ProposalVersion } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { formatDateTime } from '@/src/utils/format';

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
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]}>Versão da proposta</Text>
              {version && (
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                  {formatDateTime(version.createdAt)}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
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
              <View style={[styles.warning, { backgroundColor: colors.warning + '18' }]}>
                <Feather name="alert-triangle" size={17} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.foreground }]}>
                  Restaurar substitui os campos editáveis atuais pelo conteúdo salvo nesta versão.
                </Text>
              </View>
            </ScrollView>
          )}

          <TouchableOpacity
            disabled={!version || loading || restoring}
            style={[styles.restore, { backgroundColor: colors.primary, opacity: !version || loading || restoring ? 0.6 : 1 }]}
            onPress={onRestore}
          >
            {restoring ? <ActivityIndicator color="#FFF" /> : <Text style={styles.restoreText}>Restaurar esta versão</Text>}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.info, { borderColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.45)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '86%', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 22 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  loading: { minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 10 },
  content: { gap: 10 },
  info: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 3 },
  infoLabel: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' },
  infoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  warning: { borderRadius: 12, padding: 12, flexDirection: 'row', gap: 10 },
  warningText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  restore: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  restoreText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
