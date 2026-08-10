import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall } from '@/src/api/client';
import { Station } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UIButton, UICard, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function StationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['stations'],
    queryFn: () => apiCall<Station[]>('GET', '/stations'),
    staleTime: 60000,
  });

  const filtered = (data ?? []).filter((s) =>
    !search.trim() || s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title="Empresas"
          subtitle="Gerencie emissoras, cores e contatos comerciais."
          style={styles.headerCopy}
          action={<UIButton iconLeft="plus" title="Nova" size="sm" onPress={() => router.push('/admin/stations/new')} />}
        />
      </View>
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIInput
          leftIcon="search"
          rightIcon={search.length > 0 ? 'x' : undefined}
          onRightIconPress={() => setSearch('')}
          placeholder="Buscar empresa..."
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {isLoading ? <LoadingSpinner message="Carregando..." /> : isError ? (
        <UIEmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<UIEmptyState icon="radio" title="Nenhuma empresa encontrada" />}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: station }) => (
            <UICard
              variant="elevated"
              style={[styles.card, { borderLeftColor: station.primaryColor ?? colors.primary }]}
              onPress={() => router.push(`/admin/stations/${station.id}`)}
              accessibilityLabel={`Abrir empresa ${station.name}`}
            >
              <View style={[styles.colorDot, { backgroundColor: station.primaryColor ?? colors.primary }]} />
              <View style={styles.cardInfo}>
                <Text style={[styles.stationName, { color: colors.foreground }]}>{station.name}</Text>
                {station.city && <Text style={[styles.stationCity, { color: colors.mutedForeground }]}>{station.city}</Text>}
              </View>
              {!station.active && <UIBadge label="Inativo" color={colors.danger} size="sm" />}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </UICard>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  headerCopy: { flex: 1 },
  searchRow: { padding: spacing.md, borderBottomWidth: 1 },
  listContent: { padding: spacing.md, gap: spacing.sm, paddingBottom: 44 },
  card: { flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, gap: spacing.md },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  cardInfo: { flex: 1, gap: 2 },
  stationName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  stationCity: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
