import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UIHeader } from '@/src/ui';
import { useColors } from '@/hooks/useColors';
import { queryKeys } from '@/src/api/queryKeys';
import { listCommercialProducts, listCommercialStations } from '@/src/features/products/api';
import { CommercialProductCatalog } from '@/src/features/products/CommercialProductCatalog';
import { spacing } from '@/src/theme';

export default function CommercialProductsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const stations = useQuery({ queryKey: ['stations', 'commercial-catalog'], queryFn: listCommercialStations });
  const products = useQuery({ queryKey: queryKeys.products.list({ active: true }), queryFn: () => listCommercialProducts({ active: true }) });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.container, { backgroundColor: colors.background }]}><View style={[styles.header, { paddingTop: topPad + spacing.md, borderBottomColor: colors.border }]}><UIHeader title="Produtos" subtitle="Catálogo autorizado para suas propostas." style={{ flex: 1 }} /></View><CommercialProductCatalog stations={stations.data ?? []} products={products.data ?? []} loading={stations.isLoading || products.isLoading} error={stations.error ?? products.error} onRetry={() => { stations.refetch(); products.refetch(); }} /></View>;
}

const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 } });
