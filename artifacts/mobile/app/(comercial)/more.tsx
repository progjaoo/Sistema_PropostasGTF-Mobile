import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall } from '@/src/api/client';
import { getRecallReminderList, type RecallReminderPayload } from '@/src/utils/recallReminders';
import { UIHeader, UICard, UIBadge } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function MoreScreen() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  if (section === 'alerts') return <Redirect href="/(comercial)/alerts?legacy=1" />;
  if (section === 'profile') return <Redirect href="/(comercial)/profile?legacy=1" />;

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { data } = useQuery({
    queryKey: ['recall-reminders', 'commercial-more'],
    queryFn: () => apiCall<RecallReminderPayload>('GET', '/recall-reminders'),
    staleTime: 60000,
  });
  const pendingAlerts = getRecallReminderList(data).filter((item) => item.status === 'PENDING').length;
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.header, { paddingTop: topPad + spacing.md, borderBottomColor: colors.border }]}>
        <UIHeader title="Mais" subtitle={`Olá, ${user?.name ?? 'comercial'}.`} />
      </View>
      <View style={styles.content}>
        <Pressable onPress={() => router.push('/(comercial)/more?section=alerts' as any)} accessibilityRole="button" accessibilityLabel="Abrir avisos">
          <UICard variant="elevated" style={styles.card}>
            <View style={[styles.icon, { backgroundColor: colors.warning + '20' }]}><Feather name="bell" size={20} color={colors.warning} /></View>
            <View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]}>Avisos</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Recapturas e lembretes comerciais</Text></View>
            {pendingAlerts > 0 ? <UIBadge label={String(pendingAlerts)} color={colors.danger} /> : <Feather name="chevron-right" size={20} color={colors.mutedForeground} />}
          </UICard>
        </Pressable>
        <Pressable onPress={() => router.push('/(comercial)/more?section=profile' as any)} accessibilityRole="button" accessibilityLabel="Abrir perfil">
          <UICard variant="elevated" style={styles.card}>
            <View style={[styles.icon, { backgroundColor: colors.primary + '20' }]}><Feather name="user" size={20} color={colors.primary} /></View>
            <View style={styles.cardCopy}><Text style={[styles.title, { color: colors.foreground }]}>Meu Perfil</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Dados comerciais e sessão</Text></View><Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </UICard>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  content: { padding: spacing.lg, gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  cardCopy: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
