import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall } from '@/src/api/client';
import { Station } from '@/src/types';
import { useColors } from '@/hooks/useColors';

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
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Empresas</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/admin/stations/new')}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput style={[styles.searchText, { color: colors.foreground }]} placeholder="Buscar empresa..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={16} color={colors.mutedForeground} /></TouchableOpacity>}
        </View>
      </View>
      {isLoading ? <LoadingSpinner message="Carregando..." /> : isError ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="radio" title="Nenhuma empresa encontrada" />}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: station }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderLeftColor: station.primaryColor ?? colors.primary }]} onPress={() => router.push(`/admin/stations/${station.id}`)} activeOpacity={0.7}>
              <View style={[styles.colorDot, { backgroundColor: station.primaryColor ?? colors.primary }]} />
              <View style={styles.cardInfo}>
                <Text style={[styles.stationName, { color: colors.foreground }]}>{station.name}</Text>
                {station.city && <Text style={[styles.stationCity, { color: colors.mutedForeground }]}>{station.city}</Text>}
              </View>
              {!station.active && <View style={[styles.inactiveBadge, { backgroundColor: colors.danger + '15' }]}><Text style={[styles.inactiveText, { color: colors.danger }]}>Inativo</Text></View>}
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, gap: 12 },
  headerTitle: { flex: 1, fontSize: 22, fontFamily: 'Inter_700Bold' },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchInput: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  searchText: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  listContent: { paddingTop: 8, paddingBottom: 40 },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 5, padding: 14, borderRadius: 12, borderWidth: 1, borderLeftWidth: 4, gap: 12 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  cardInfo: { flex: 1, gap: 2 },
  stationName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  stationCity: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  inactiveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  inactiveText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
