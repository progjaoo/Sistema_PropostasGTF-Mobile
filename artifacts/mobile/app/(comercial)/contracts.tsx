import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UIHeader } from '@/src/ui';
import { useColors } from '@/hooks/useColors';
import { queryKeys } from '@/src/api/queryKeys';
import { getContractForecast, getContractSummary, listContracts } from '@/src/features/contracts/api';
import { CommercialContractsScreen } from '@/src/features/contracts/CommercialContractsScreen';
import { spacing } from '@/src/theme';

export default function CommercialContractsRoute() {
  const colors = useColors(); const insets = useSafeAreaInsets();
  const contracts = useQuery({ queryKey: queryKeys.contracts.list(), queryFn: () => listContracts() });
  const summary = useQuery({ queryKey: queryKeys.contracts.summary(), queryFn: () => getContractSummary() });
  const forecast = useQuery({ queryKey: queryKeys.contracts.forecast(undefined, 12), queryFn: () => getContractForecast(undefined, 12) });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.container, { backgroundColor: colors.background }]}><View style={[styles.header, { paddingTop: topPad + spacing.md, borderBottomColor: colors.border }]}><UIHeader title="Contratos" subtitle="Acompanhe sua carteira e receitas futuras." /></View><CommercialContractsScreen contracts={contracts.data ?? []} summary={summary.data ?? { month: '', soldThisMonth: '0', expectedRevenue: '0', activeContracts: 0, endingIn30Days: 0 }} forecast={forecast.data ?? { from: '', months: 12, data: [] }} loading={contracts.isLoading || summary.isLoading || forecast.isLoading} error={contracts.error ?? summary.error ?? forecast.error} onRetry={() => { contracts.refetch(); summary.refetch(); forecast.refetch(); }} onSelect={(contract) => router.push(`/contracts/${contract.id}` as any)} onCreate={() => router.push('/contracts/new' as any)} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 } });
