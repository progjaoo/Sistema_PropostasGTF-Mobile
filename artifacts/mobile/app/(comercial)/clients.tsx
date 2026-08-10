import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, RefreshControl, Platform,
} from 'react-native';
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

export default function ClientsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['advertisers', 'CLIENT', search],
    queryFn: () => {
      const params = new URLSearchParams({ status: 'CLIENT' });
      if (search.trim()) params.set('search', search.trim());
      return apiCall<Advertiser[]>('GET', `/advertisers?${params}`);
    },
    staleTime: 30000,
  });

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Clientes</Text>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchText, { color: colors.foreground }]}
            placeholder="Buscar cliente..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando clientes..." />
      ) : isError ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" description="Não foi possível carregar os clientes." actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(a) => a.id}
          renderItem={({ item }) => (
            <AdvertiserCard
              advertiser={item}
              badge="Cliente"
              badgeColor={colors.success}
              onPress={() => router.push(`/advertiser/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={
            <EmptyState icon="users" title="Nenhum cliente" description={search ? 'Nenhum cliente encontrado.' : 'Os clientes aparecem aqui após aceitar uma proposta.'} />
          }
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
  listContent: { paddingTop: 8, paddingBottom: 120 },
});
