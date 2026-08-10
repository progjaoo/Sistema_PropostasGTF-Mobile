import React from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { apiCall } from '@/src/api/client';
import type { RecallReminder } from '@/src/types';
import { MILESTONE_LABELS, RECALL_STATUS_LABELS } from '@/src/utils/enums';
import { formatDate } from '@/src/utils/format';
import { getRecallAdvertiserName, getRecallReminderList, type RecallReminderPayload } from '@/src/utils/recallReminders';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UIButton, UICard, UIEmptyState, UIHeader } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function AlertsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['recall-reminders'],
    queryFn: () => apiCall<RecallReminderPayload>('GET', '/recall-reminders'),
    staleTime: 60000,
  });

  const doneMutation = useMutation({
    mutationFn: (id: string) => apiCall('PATCH', `/recall-reminders/${id}/done`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall-reminders'] });
      showToast('Aviso marcado como tratado.', 'success');
    },
    onError: () => showToast('Erro ao atualizar aviso.', 'error'),
  });

  const snoozeMutation = useMutation({
    mutationFn: ({ id, days }: { id: string; days: number }) =>
      apiCall('PATCH', `/recall-reminders/${id}/snooze`, { days }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recall-reminders'] });
      showToast('Aviso adiado.', 'info');
    },
    onError: () => showToast('Erro ao adiar aviso.', 'error'),
  });

  const now = new Date();
  const all = getRecallReminderList(data);
  const overdue = all.filter((reminder) => reminder.status === 'PENDING' && new Date(reminder.dueAt) <= now);
  const upcoming = all.filter((reminder) => reminder.status === 'PENDING' && new Date(reminder.dueAt) > now);
  const others = all.filter((reminder) => reminder.status !== 'PENDING');
  const allItems = [
    ...overdue.map((item) => ({ item, isOverdue: true })),
    ...upcoming.map((item) => ({ item, isOverdue: false })),
    ...others.map((item) => ({ item, isOverdue: false })),
  ];

  const renderItem = (item: RecallReminder, isOverdue: boolean) => {
    const milestone = MILESTONE_LABELS[item.milestoneMonths] ?? `${item.milestoneMonths} meses`;
    const statusLabel = RECALL_STATUS_LABELS[item.status] ?? item.status;
    const accentColor = isOverdue ? colors.danger : item.status === 'DONE' ? colors.success : colors.warning;

    return (
      <UICard variant="elevated" style={[styles.card, { borderLeftColor: accentColor }]}>
        <View style={styles.cardTitleRow}>
          <Feather name="clock" size={15} color={accentColor} />
          <Text style={[styles.milestone, { color: accentColor }]}>{milestone}</Text>
          <UIBadge label={isOverdue ? 'Vencido' : statusLabel} color={accentColor} size="sm" />
        </View>

        <Text style={[styles.dueDate, { color: colors.mutedForeground }]}>
          Vence: {formatDate(item.dueAt)}
        </Text>

        {getRecallAdvertiserName(item) ? (
          <Text style={[styles.advertiserName, { color: colors.foreground }]} numberOfLines={1}>
            {getRecallAdvertiserName(item)}
          </Text>
        ) : null}

        {item.proposal ? (
          <UIButton
            title="Ver proposta"
            variant="outline"
            size="sm"
            iconRight="arrow-right"
            onPress={() => router.push(`/proposal/${item.proposalId}`)}
          />
        ) : null}

        {item.status === 'PENDING' ? (
          <View style={styles.actions}>
            {[7, 15, 30].map((days) => (
              <UIButton
                key={days}
                title={`${days} dias`}
                variant="outline"
                size="sm"
                iconLeft="clock"
                style={styles.actionBtn}
                onPress={() => snoozeMutation.mutate({ id: item.id, days })}
                disabled={snoozeMutation.isPending}
              />
            ))}
            <UIButton
              title="Tratado"
              size="sm"
              iconLeft="check"
              style={[styles.actionBtn, { backgroundColor: colors.success, borderColor: colors.success }]}
              onPress={() => doneMutation.mutate(item.id)}
              disabled={doneMutation.isPending}
            />
          </View>
        ) : null}
      </UICard>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIHeader
          title="Avisos"
          subtitle="Priorize recapturas vencidas e oportunidades futuras."
          action={overdue.length > 0 ? <UIBadge label={String(overdue.length)} color={colors.danger} /> : undefined}
        />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando avisos..." />
      ) : isError ? (
        <UIEmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={({ item }) => item.id}
          renderItem={({ item: { item, isOverdue } }) => renderItem(item, isOverdue)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<UIEmptyState icon="bell" title="Sem avisos" description="Nenhum aviso de recaptura pendente." />}
          scrollEnabled={allItems.length > 0}
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
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  milestone: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  dueDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  advertiserName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: 4 },
  actionBtn: { flexGrow: 1 },
});
