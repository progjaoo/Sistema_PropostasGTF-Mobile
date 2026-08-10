import React from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { apiCall } from '@/src/api/client';
import { MILESTONE_LABELS } from '@/src/utils/enums';
import { formatDate } from '@/src/utils/format';
import {
  getRecallAdvertiserName,
  getRecallReminderList,
  getRecallStationName,
  type RecallReminderPayload,
} from '@/src/utils/recallReminders';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UIButton, UICard, UIEmptyState, UIHeader } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function AdminAlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-recall-reminders'],
    queryFn: () => apiCall<RecallReminderPayload>('GET', '/recall-reminders'),
    staleTime: 60000,
  });

  const doneMutation = useMutation({
    mutationFn: (id: string) => apiCall('PATCH', `/recall-reminders/${id}/done`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recall-reminders'] });
      showToast('Aviso marcado como tratado.', 'success');
    },
    onError: () => showToast('Erro ao atualizar.', 'error'),
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      apiCall('PATCH', `/recall-reminders/${id}/snooze`, { days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-recall-reminders'] });
      showToast('Aviso adiado.', 'success');
    },
    onError: () => showToast('Erro ao adiar aviso.', 'error'),
  });

  const now = new Date();
  const all = getRecallReminderList(data);
  const overdue = all.filter((reminder) => reminder.status === 'PENDING' && new Date(reminder.dueAt) <= now);
  const rest = all.filter((reminder) => !(reminder.status === 'PENDING' && new Date(reminder.dueAt) <= now));
  const sorted = [...overdue, ...rest];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIHeader
          title="Avisos de Recaptura"
          subtitle="Visão geral dos clientes e leads prontos para nova abordagem."
          action={overdue.length > 0 ? <UIBadge label={String(overdue.length)} color={colors.danger} /> : undefined}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando..." />
      ) : isError ? (
        <UIEmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(reminder) => reminder.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<UIEmptyState icon="bell" title="Sem avisos pendentes" description="Nenhum aviso de recaptura no momento." />}
          scrollEnabled={sorted.length > 0}
          renderItem={({ item }) => {
            const isOverdue = item.status === 'PENDING' && new Date(item.dueAt) <= now;
            const milestone = MILESTONE_LABELS[item.milestoneMonths] ?? `${item.milestoneMonths} meses`;
            const accentColor = isOverdue ? colors.danger : item.status === 'DONE' ? colors.success : colors.warning;
            const advertiserName = getRecallAdvertiserName(item);
            const stationName = getRecallStationName(item);

            return (
              <UICard variant="elevated" style={[styles.card, { borderLeftColor: accentColor }]}>
                <View style={styles.cardTop}>
                  <Feather name="bell" size={15} color={accentColor} />
                  <Text style={[styles.milestone, { color: accentColor }]}>{milestone}</Text>
                  {isOverdue ? <UIBadge label="Vencido" color={colors.danger} size="sm" /> : null}
                </View>
                {advertiserName ? <Text style={[styles.advertiserName, { color: colors.foreground }]}>{advertiserName}</Text> : null}
                <Text style={[styles.dueDate, { color: colors.mutedForeground }]}>Vence: {formatDate(item.dueAt)}</Text>
                {stationName ? <Text style={[styles.stationName, { color: colors.mutedForeground }]}>{stationName}</Text> : null}
                <View style={styles.actions}>
                  <UIButton
                    title="Ver proposta"
                    variant="outline"
                    size="sm"
                    iconRight="arrow-right"
                    style={styles.viewBtn}
                    onPress={() => router.push(`/proposal/${item.proposalId}`)}
                  />
                  {item.status === 'PENDING' ? (
                    <>
                      {[7, 15, 30].map((days) => (
                        <UIButton
                          key={days}
                          title={`${days}d`}
                          variant="outline"
                          size="sm"
                          onPress={() => snoozeMutation.mutate({ id: item.id, days })}
                          disabled={snoozeMutation.isPending}
                        />
                      ))}
                      <UIButton
                        title="Tratado"
                        size="sm"
                        iconLeft="check"
                        style={[styles.doneBtn, { backgroundColor: colors.success, borderColor: colors.success }]}
                        onPress={() => doneMutation.mutate(item.id)}
                        disabled={doneMutation.isPending}
                      />
                    </>
                  ) : null}
                </View>
              </UICard>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  listContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  card: { borderLeftWidth: 4, gap: spacing.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  milestone: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  advertiserName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  dueDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  stationName: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  viewBtn: { flexGrow: 1 },
  doneBtn: { flexGrow: 1 },
});
