import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { AdvertiserCard } from '@/components/AdvertiserCard';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall } from '@/src/api/client';
import { Advertiser } from '@/src/types';
import { useColors } from '@/hooks/useColors';

export default function AdminClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'CLIENT' | 'LEAD' | ''>('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-advertisers', statusFilter, search],
    queryFn: () => {
      const p = new URLSearchParams();
      if (statusFilter) p.set('status', statusFilter);
      if (search.trim()) p.set('search', search.trim());
      return apiCall<Advertiser[]>('GET', `/advertisers?${p}`);
    },
    staleTime: 30000,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Anunciantes</Text>
      </View>
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput style={[styles.searchText, { color: colors.foreground }]} placeholder="Buscar..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={16} color={colors.mutedForeground} /></TouchableOpacity>}
        </View>
      </View>
      <View style={[styles.filterRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <FlatList horizontal data={[{ label: 'Todos', value: '' as const }, { label: 'Clientes', value: 'CLIENT' as const }, { label: 'Leads', value: 'LEAD' as const }]} keyExtractor={(i) => i.value} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.filterChip, { borderColor: colors.border }, item.value === statusFilter && { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setStatusFilter(item.value)}>
              <Text style={[styles.filterText, { color: colors.mutedForeground }, item.value === statusFilter && { color: '#FFF' }]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
      {isLoading ? <LoadingSpinner message="Carregando..." /> : isError ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AdvertiserCard advertiser={item} badge={item.status === 'CLIENT' ? 'Cliente' : 'Lead'} badgeColor={item.status === 'CLIENT' ? colors.success : colors.warning} onPress={() => router.push(`/advertiser/${item.id}`)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="users" title="Nenhum anunciante encontrado" />}
          scrollEnabled={!!(data?.length)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  searchText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  filterRow: { borderBottomWidth: 1 },
  filterList: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, borderWidth: 1 },
  filterText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  listContent: { paddingTop: 8, paddingBottom: 120 },
});
