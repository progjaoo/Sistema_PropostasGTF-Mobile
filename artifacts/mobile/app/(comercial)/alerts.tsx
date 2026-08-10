import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { apiCall } from '@/src/api/client';
import { RecallReminder } from '@/src/types';
import { RECALL_STATUS_LABELS, MILESTONE_LABELS } from '@/src/utils/enums';
import { formatDate } from '@/src/utils/format';
import { getRecallAdvertiserName, getRecallReminderList, RecallReminderPayload } from '@/src/utils/recallReminders';
import { useColors } from '@/hooks/useColors';

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
  const overdue = all.filter(
    (r) => r.status === 'PENDING' && new Date(r.dueAt) <= now,
  );
  const upcoming = all.filter(
    (r) => r.status === 'PENDING' && new Date(r.dueAt) > now,
  );
  const others = all.filter((r) => r.status !== 'PENDING');

  const renderItem = (item: RecallReminder, isOverdue: boolean) => {
    const milestone = MILESTONE_LABELS[item.milestoneMonths] ?? `${item.milestoneMonths} meses`;
    const statusLabel = RECALL_STATUS_LABELS[item.status] ?? item.status;
    const accentColor = isOverdue ? colors.danger : item.status === 'DONE' ? colors.success : colors.warning;

    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accentColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Feather name="clock" size={14} color={accentColor} />
            <Text style={[styles.milestone, { color: accentColor }]}>{milestone}</Text>
            <View style={[styles.statusBadge, { backgroundColor: accentColor + '20' }]}>
              <Text style={[styles.statusText, { color: accentColor }]}>{isOverdue ? 'Vencido' : statusLabel}</Text>
            </View>
          </View>
          <Text style={[styles.dueDate, { color: colors.mutedForeground }]}>
            Vence: {formatDate(item.dueAt)}
          </Text>
        </View>

        {getRecallAdvertiserName(item) && (
          <Text style={[styles.advertiserName, { color: colors.foreground }]} numberOfLines={1}>
            {getRecallAdvertiserName(item)}
          </Text>
        )}

        {item.proposal && (
          <TouchableOpacity onPress={() => router.push(`/proposal/${item.proposalId}`)}>
            <Text style={[styles.proposalLink, { color: colors.primary }]}>Ver proposta →</Text>
          </TouchableOpacity>
        )}

        {item.status === 'PENDING' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={() => snoozeMutation.mutate({ id: item.id, days: 7 })}
              disabled={snoozeMutation.isPending}
            >
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.actionText, { color: colors.mutedForeground }]}>7 dias</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={() => snoozeMutation.mutate({ id: item.id, days: 15 })}
              disabled={snoozeMutation.isPending}
            >
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.actionText, { color: colors.mutedForeground }]}>15 dias</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.border }]}
              onPress={() => snoozeMutation.mutate({ id: item.id, days: 30 })}
              disabled={snoozeMutation.isPending}
            >
              <Feather name="clock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.actionText, { color: colors.mutedForeground }]}>30 dias</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.success }]}
              onPress={() => doneMutation.mutate(item.id)}
              disabled={doneMutation.isPending}
            >
              <Feather name="check" size={14} color="#FFF" />
              <Text style={styles.doneBtnText}>Tratado</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const allItems = [
    ...overdue.map((r) => ({ item: r, isOverdue: true })),
    ...upcoming.map((r) => ({ item: r, isOverdue: false })),
    ...others.map((r) => ({ item: r, isOverdue: false })),
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Avisos</Text>
        {overdue.length > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.danger }]}>
            <Text style={styles.badgeText}>{overdue.length}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando avisos..." />
      ) : isError ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={allItems}
          keyExtractor={(i) => i.item.id}
          renderItem={({ item: { item, isOverdue } }) => renderItem(item, isOverdue)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="bell" title="Sem avisos" description="Nenhum aviso de recaptura pendente." />}
          scrollEnabled={allItems.length > 0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  badgeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#FFF' },
  listContent: { padding: 16, gap: 12, paddingBottom: 120 },
  card: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 8 },
  cardHeader: { gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  milestone: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  dueDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  advertiserName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  proposalLink: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  actionText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flex: 1, justifyContent: 'center' },
  doneBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
});
