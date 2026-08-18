import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContractForecast, getContractSummary, listContracts } from '@/src/features/contracts/api';
import { ContractList } from '@/src/features/contracts/ContractList';
import { ContractSummary } from '@/src/features/contracts/ContractSummary';
import { RevenueForecast } from '@/src/features/contracts/RevenueForecast';
import { queryKeys } from '@/src/api/queryKeys';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { EmptyState } from '@/components/EmptyState';
import { useColors } from '@/hooks/useColors';
import { UIButton, UIChip, UIHeader } from '@/src/ui';
import { apiCall } from '@/src/api/client';
import type { User } from '@/src/types';
import { spacing } from '@/src/theme';

export default function AdminContractsScreen() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const [ownerId, setOwnerId] = useState<string | undefined>();
  const filters = { ownerId }; const users = useQuery({ queryKey: ['users'], queryFn: () => apiCall<User[]>('GET', '/users') }); const contracts = useQuery({ queryKey: queryKeys.contracts.list(filters), queryFn: () => listContracts(filters) });
  const summary = useQuery({ queryKey: queryKeys.contracts.summary(), queryFn: () => getContractSummary(undefined, ownerId) });
  const forecast = useQuery({ queryKey: queryKeys.contracts.forecast(undefined, 12), queryFn: () => getContractForecast(undefined, 12, ownerId) });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.container, { backgroundColor: colors.background }]}><View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}><UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" /><UIHeader title="Contratos" subtitle="Visão global, métricas e previsão de receita." style={{ flex: 1 }} action={<UIButton title="Novo" iconLeft="plus" size="sm" onPress={() => router.push('/admin/contracts/new')} />} /></View>{contracts.isLoading || summary.isLoading || forecast.isLoading ? <LoadingSpinner message="Carregando contratos..." /> : contracts.isError || summary.isError || forecast.isError ? <EmptyState icon="alert-circle" title="Erro ao carregar contratos" actionLabel="Tentar novamente" onAction={() => { contracts.refetch(); summary.refetch(); forecast.refetch(); }} /> : <ScrollView refreshControl={<RefreshControl refreshing={contracts.isFetching} onRefresh={contracts.refetch} />} contentContainerStyle={styles.content}><ContractSummary summary={summary.data!} /><RevenueForecast forecast={forecast.data!} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}><UIChip label="Todos os responsáveis" active={!ownerId} onPress={() => setOwnerId(undefined)} />{(users.data ?? []).filter((user) => user.role === 'COMERCIAL').map((user) => <UIChip key={user.id} label={user.name} active={ownerId === user.id} onPress={() => setOwnerId(user.id)} />)}</ScrollView><ContractList contracts={contracts.data ?? []} onSelect={(contract) => router.push(`/admin/contracts/${contract.id}`)} /></ScrollView>}</View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, gap: spacing.sm }, content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 140 } });
