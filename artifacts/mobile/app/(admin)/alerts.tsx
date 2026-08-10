// Admin alerts - same logic as comercial/alerts but shows all
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
import { MILESTONE_LABELS } from '@/src/utils/enums';
import { formatDate } from '@/src/utils/format';
import { getRecallAdvertiserName, getRecallReminderList, getRecallStationName, RecallReminderPayload } from '@/src/utils/recallReminders';
import { useColors } from '@/hooks/useColors';

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin-recall-reminders'] }); showToast('Aviso marcado como tratado.', 'success'); },
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
  const overdue = all.filter((r) => r.status === 'PENDING' && new Date(r.dueAt) <= now);
  const rest = all.filter((r) => !(r.status === 'PENDING' && new Date(r.dueAt) <= now));
  const sorted = [...overdue, ...rest];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Avisos de Recaptura</Text>
        {overdue.length > 0 && <View style={[styles.badge, { backgroundColor: colors.danger }]}><Text style={styles.badgeText}>{overdue.length}</Text></View>}
      </View>
      {isLoading ? <LoadingSpinner message="Carregando..." /> : isError ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="bell" title="Sem avisos pendentes" description="Nenhum aviso de recaptura no momento." />}
          scrollEnabled={sorted.length > 0}
          renderItem={({ item }) => {
            const isOverdue = item.status === 'PENDING' && new Date(item.dueAt) <= now;
            const milestone = MILESTONE_LABELS[item.milestoneMonths] ?? `${item.milestoneMonths} meses`;
            const accentColor = isOverdue ? colors.danger : item.status === 'DONE' ? colors.success : colors.warning;
            const advertiserName = getRecallAdvertiserName(item);
            const stationName = getRecallStationName(item);
            return (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: accentColor }]}>
                <View style={styles.cardTop}>
                  <Text style={[styles.milestone, { color: accentColor }]}>{milestone}</Text>
                  {isOverdue && <View style={[styles.overdueTag, { backgroundColor: colors.danger + '20' }]}><Text style={[styles.overdueText, { color: colors.danger }]}>Vencido</Text></View>}
                </View>
                {advertiserName && <Text style={[styles.advertiserName, { color: colors.foreground }]}>{advertiserName}</Text>}
                <Text style={[styles.dueDate, { color: colors.mutedForeground }]}>Vence: {formatDate(item.dueAt)}</Text>
                {stationName && <Text style={[styles.stationName, { color: colors.mutedForeground }]}>{stationName}</Text>}
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => router.push(`/proposal/${item.proposalId}`)} style={[styles.viewBtn, { borderColor: colors.primary }]}>
                    <Text style={[styles.viewBtnText, { color: colors.primary }]}>Ver proposta</Text>
                  </TouchableOpacity>
                  {item.status === 'PENDING' && (
                    <>
                    {[7, 15, 30].map((days) => (
                      <TouchableOpacity
                        key={days}
                        style={[styles.snoozeBtn, { borderColor: colors.border }]}
                        onPress={() => snoozeMutation.mutate({ id: item.id, days })}
                        disabled={snoozeMutation.isPending}
                      >
                        <Text style={[styles.snoozeText, { color: colors.mutedForeground }]}>{days}d</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[styles.doneBtn, { backgroundColor: colors.success }]} onPress={() => doneMutation.mutate(item.id)} disabled={doneMutation.isPending}>
                      <Feather name="check" size={14} color="#FFF" />
                      <Text style={styles.doneBtnText}>Tratado</Text>
                    </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            );
          }}
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
  card: { borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  milestone: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  overdueTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  overdueText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  advertiserName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  dueDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  stationName: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  viewBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
  viewBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  doneBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  doneBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  snoozeBtn: { minWidth: 44, minHeight: 36, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  snoozeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
