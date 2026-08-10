import React, { useState } from 'react';
import { FlatList, Platform, RefreshControl, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdvertiserCard } from '@/components/AdvertiserCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall } from '@/src/api/client';
import type { Advertiser, AdvertiserStatus } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIButton, UIChip, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

type FilterValue = AdvertiserStatus | '';

type AdvertiserListScreenProps = {
  title: string;
  subtitle: string;
  queryKeyPrefix: string;
  initialStatus?: FilterValue;
  allowStatusFilter?: boolean;
  showNewLeadAction?: boolean;
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
  emptyTitle,
  emptyDescription,
}: AdvertiserListScreenProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>(initialStatus);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [queryKeyPrefix, statusFilter, search],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      return apiCall<Advertiser[]>('GET', `/advertisers?${params}`);
    },
    staleTime: 30000,
  });

  const list = data ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerSurface, { paddingTop: topPad + spacing.md, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIHeader
          title={title}
          subtitle={subtitle}
          action={
            showNewLeadAction ? (
              <UIButton
                iconLeft="plus"
                title="Lead"
                size="sm"
                onPress={() => router.push('/advertiser/new?status=LEAD')}
                accessibilityLabel="Criar novo lead"
              />
            ) : undefined
          }
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
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando..." />
      ) : isError ? (
        <UIEmptyState
          icon="alert-circle"
          title="Erro ao carregar"
          description="Não foi possível carregar os cadastros."
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
  filters: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
});
