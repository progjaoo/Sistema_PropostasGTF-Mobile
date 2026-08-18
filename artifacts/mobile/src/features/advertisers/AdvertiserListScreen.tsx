import React, { useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdvertiserCard } from '@/components/AdvertiserCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ApiError, apiCall } from '@/src/api/client';
import type { Advertiser, AdvertiserStatus } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIButton, UIChip, UIEmptyState, UIHeader, UIInput, UIBottomSheet } from '@/src/ui';
import { spacing } from '@/src/theme';
import { LeadToClientSelector } from './LeadToClientSelector';
import { getAdvertiserErrorMessage, promoteAdvertiserToClient } from './api';
import { queryKeys } from '@/src/api/queryKeys';

type FilterValue = AdvertiserStatus | '';

type AdvertiserListScreenProps = {
  title: string;
  subtitle: string;
  queryKeyPrefix: string;
  initialStatus?: FilterValue;
  allowStatusFilter?: boolean;
  showNewLeadAction?: boolean;
  showClientLeadSegments?: boolean;
  showLeadConversionAction?: boolean;
  emptyTitle: string;
  emptyDescription: string;
};

const STATUS_FILTERS: Array<{ label: string; value: FilterValue }> = [
  { label: 'Todos', value: '' },
  { label: 'Clientes', value: 'CLIENT' },
  { label: 'Leads', value: 'LEAD' },
];

export function AdvertiserListScreen({
  title,
  subtitle,
  queryKeyPrefix,
  initialStatus = '',
  allowStatusFilter = false,
  showNewLeadAction = false,
  showClientLeadSegments = false,
  showLeadConversionAction = false,
  emptyTitle,
  emptyDescription,
}: AdvertiserListScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(initialStatus);
  const [conversionVisible, setConversionVisible] = useState(false);
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching, error } = useQuery({
    queryKey: [queryKeyPrefix, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set('active', 'true');
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      return apiCall<Advertiser[]>('GET', `/advertisers?${params}`);
    },
    staleTime: 30000,
  });

  const list = data ?? [];
  const conversionMutation = useMutation({
    mutationFn: promoteAdvertiserToClient,
    onSuccess: (advertiser) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.advertisers.all });
      setConversionVisible(false);
      router.push(`/advertiser/${advertiser.id}`);
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerSurface, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIHeader
          title={title}
          subtitle={subtitle}
          action={showNewLeadAction || showLeadConversionAction ? <View style={styles.headerActions}>
            {showLeadConversionAction && <UIButton iconLeft="repeat" title="Converter lead" size="sm" onPress={() => setConversionVisible(true)} />}
            {showNewLeadAction && <UIButton iconLeft="plus" title="Lead" size="sm" onPress={() => router.push('/advertiser/new?status=LEAD')} accessibilityLabel="Criar novo lead" />}
          </View> : undefined}
        />
        <UIInput
          leftIcon="search"
          rightIcon={search ? 'x' : undefined}
          onRightIconPress={() => setSearch('')}
          placeholder="Buscar por nome, contato ou telefone"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {allowStatusFilter ? (
          <FlatList
            horizontal
            data={STATUS_FILTERS}
            keyExtractor={(item) => item.value || 'ALL'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            renderItem={({ item }) => (
              <UIChip
                label={item.label}
                active={statusFilter === item.value}
                onPress={() => setStatusFilter(item.value)}
              />
            )}
          />
        ) : null}
        {showClientLeadSegments ? (
          <FlatList
            horizontal
            data={[{ label: 'Clientes', value: 'CLIENT' as const }, { label: 'Leads', value: 'LEAD' as const }]}
            keyExtractor={(item) => item.value}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            renderItem={({ item }) => (
              <UIChip label={item.label} active={statusFilter === item.value} onPress={() => setStatusFilter(item.value)} />
            )}
          />
        ) : null}
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando..." />
      ) : isError ? (
        <UIEmptyState
          icon="alert-circle"
          title="Erro ao carregar"
          description={getAdvertiserErrorMessage(error)}
          actionLabel="Tentar novamente"
          onAction={() => refetch()}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(advertiser) => advertiser.id}
          renderItem={({ item }) => (
            <AdvertiserCard
              advertiser={item}
              badge={item.status === 'CLIENT' ? 'Cliente' : 'Lead'}
              badgeColor={item.status === 'CLIENT' ? colors.success : colors.warning}
              onPress={() => router.push(`/advertiser/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <UIEmptyState
              icon={initialStatus === 'LEAD' ? 'user-plus' : 'users'}
              title={emptyTitle}
              description={search ? 'Nenhum cadastro encontrado para esta busca.' : emptyDescription}
              actionLabel={showNewLeadAction ? 'Novo lead' : undefined}
              onAction={showNewLeadAction ? () => router.push('/advertiser/new?status=LEAD') : undefined}
            />
          }
          scrollEnabled={list.length > 0}
        />
      )}
      {showLeadConversionAction && <UIBottomSheet visible={conversionVisible} onClose={() => setConversionVisible(false)} style={styles.conversionSheet}>
        <LeadToClientSelector leads={list.filter((item) => item.status === 'LEAD')} onPromote={(id) => conversionMutation.mutate(id)} pending={conversionMutation.isPending} />
        {conversionMutation.isError && <UIEmptyState icon="alert-circle" title="Não foi possível converter" description={conversionMutation.error instanceof ApiError ? getAdvertiserErrorMessage(conversionMutation.error) : 'Tente novamente.'} />}
      </UIBottomSheet>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerSurface: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  headerActions: { flexDirection: 'row', gap: spacing.xs },
  conversionSheet: { maxHeight: '90%' },
  filters: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
});
