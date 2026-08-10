import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
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
import { UIBadge, UIButton, UICard, UIHeader } from '@/src/ui';
import { shadows, spacing, tokens } from '@/src/theme';

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
        <UIHeader
          eyebrow="Resumo geral"
          title={`Olá, ${user?.name?.split(' ')[0] ?? 'Admin'}`}
          subtitle="Acompanhe o desempenho comercial por status."
          action={<UIBadge label="ADMIN" color={colors.primary} />}
        />
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
              <UICard
                key={key}
                variant="elevated"
                style={[styles.statCard, { borderTopColor: PROPOSAL_STATUS_COLORS[status as keyof typeof PROPOSAL_STATUS_COLORS] }]}
                onPress={() => router.push(`/(admin)/proposals?status=${status}`)}
              >
                <Feather name={icon as any} size={20} color={PROPOSAL_STATUS_COLORS[status as keyof typeof PROPOSAL_STATUS_COLORS]} />
                <Text style={[styles.statValue, { color: colors.foreground }]}>
                  {(stats as any)[key] ?? 0}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
              </UICard>
            ))}
          </View>
        ) : null}

        {/* Recent */}
        <View style={styles.recentHeader}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENTES</Text>
          <UIButton title="Ver todas" variant="ghost" size="sm" iconRight="arrow-right" onPress={() => router.push('/(admin)/proposals')} />
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
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 },
  scrollContent: { paddingBottom: 120 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 0.8, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: spacing.sm },
  statCard: { flex: 1, minWidth: '45%', borderTopWidth: 3, padding: spacing.lg, gap: spacing.xs, alignItems: 'center', borderRadius: tokens.radius.xl, ...shadows.sm },
  statValue: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingRight: spacing.md },
});
