import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { ProposalCard } from '@/components/ProposalCard';
import { apiCall } from '@/src/api/client';
import { DashboardStats, ProposalSummary } from '@/src/types';
import { PROPOSAL_STATUS_COLORS } from '@/src/utils/enums';
import { useAuthStore } from '@/src/store/authStore';
import { useColors } from '@/hooks/useColors';

const STAT_CARDS = [
  { key: 'draft', label: 'Rascunhos', icon: 'edit-3', status: 'DRAFT' },
  { key: 'sent', label: 'Enviadas', icon: 'send', status: 'SENT' },
  { key: 'approved', label: 'Aceitas', icon: 'check-circle', status: 'APPROVED' },
  { key: 'rejected', label: 'Rejeitadas', icon: 'x-circle', status: 'REJECTED' },
] as const;

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isFetching: statsFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiCall<DashboardStats>('GET', '/dashboard/stats'),
    staleTime: 60000,
  });

  const { data: recent, isLoading: recentLoading, refetch: refetchRecent } = useQuery({
    queryKey: ['recent-proposals'],
    queryFn: () => apiCall<ProposalSummary[]>('GET', '/dashboard/recent-proposals'),
    staleTime: 60000,
  });

  const handleRefresh = () => { refetchStats(); refetchRecent(); };
  const isRefreshing = statsFetching && !statsLoading;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Olá,</Text>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name?.split(' ')[0] ?? 'Admin'}</Text>
        </View>
        <View style={[styles.adminBadge, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.adminText, { color: colors.primary }]}>ADMIN</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
      >
        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RESUMO GERAL</Text>
        {statsLoading ? (
          <LoadingSpinner full={false} />
        ) : stats ? (
          <View style={styles.statsGrid}>
            {STAT_CARDS.map(({ key, label, icon, status }) => (
              <TouchableOpacity
                key={key}
                style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border, borderTopColor: PROPOSAL_STATUS_COLORS[status as keyof typeof PROPOSAL_STATUS_COLORS] }]}
                onPress={() => router.push(`/(admin)/proposals?status=${status}`)}
                activeOpacity={0.7}
              >
                <Feather name={icon as any} size={20} color={PROPOSAL_STATUS_COLORS[status as keyof typeof PROPOSAL_STATUS_COLORS]} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {(stats as any)[key] ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* Recent */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENTES</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/proposals')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {recentLoading ? (
          <LoadingSpinner full={false} />
        ) : (recent ?? []).length === 0 ? (
          <EmptyState icon="file-text" title="Sem propostas recentes" />
        ) : (
          (recent ?? []).map((p) => <ProposalCard key={p.id} proposal={p} showOwner />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  greeting: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  userName: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  adminBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 99 },
  adminText: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  scrollContent: { paddingBottom: 120 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 12, borderWidth: 1, borderTopWidth: 3, padding: 16, gap: 4, alignItems: 'center' },
  statValue: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: 16 },
  seeAll: { fontSize: 13, fontFamily: 'Inter_500Medium' },
});
