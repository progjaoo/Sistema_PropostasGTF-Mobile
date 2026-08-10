import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall } from '@/src/api/client';
import { User } from '@/src/types';
import { getInitials } from '@/src/utils/format';
import { useColors } from '@/hooks/useColors';

export default function UsersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiCall<User[]>('GET', '/users'),
    staleTime: 60000,
  });

  const filtered = (data ?? []).filter((u) =>
    !search.trim() || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Usuários</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/admin/users/new')}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.searchInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput style={[styles.searchText, { color: colors.foreground }]} placeholder="Buscar usuário..." placeholderTextColor={colors.mutedForeground} value={search} onChangeText={setSearch} />
          {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Feather name="x" size={16} color={colors.mutedForeground} /></TouchableOpacity>}
        </View>
      </View>

      {isLoading ? <LoadingSpinner message="Carregando..." /> : isError ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<EmptyState icon="users" title="Nenhum usuário encontrado" />}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: user }) => (
            <TouchableOpacity
              style={[styles.userCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/admin/users/${user.id}`)}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, { backgroundColor: user.active ? colors.accent : colors.muted }]}>
                <Text style={[styles.avatarText, { color: user.active ? colors.primary : colors.mutedForeground }]}>{getInitials(user.name)}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: user.active ? colors.foreground : colors.mutedForeground }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
              </View>
              <View style={styles.userMeta}>
                <View style={[styles.roleBadge, { backgroundColor: user.role === 'ADMIN' ? colors.primary + '15' : colors.accent }]}>
                  <Text style={[styles.roleText, { color: user.role === 'ADMIN' ? colors.primary : colors.mutedForeground }]}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Comercial'}
                  </Text>
                </View>
                {!user.active && (
                  <View style={[styles.inactiveBadge, { backgroundColor: colors.danger + '15' }]}>
                    <Text style={[styles.inactiveText, { color: colors.danger }]}>Inativo</Text>
                  </View>
                )}
              </View>
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
  userCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginVertical: 5, padding: 14, borderRadius: 12, borderWidth: 1, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  userEmail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  userMeta: { gap: 4, alignItems: 'flex-end' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  roleText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  inactiveBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  inactiveText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});
