import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall } from '@/src/api/client';
import { User } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIAvatar, UIBadge, UIButton, UICard, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

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
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title="Usuários"
          subtitle="Gerencie perfis comerciais e permissões por empresa."
          style={styles.headerCopy}
          action={<UIButton iconLeft="plus" title="Novo" size="sm" onPress={() => router.push('/admin/users/new')} />}
        />
      </View>

      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIInput
          leftIcon="search"
          rightIcon={search.length > 0 ? 'x' : undefined}
          onRightIconPress={() => setSearch('')}
          placeholder="Buscar usuário..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? <LoadingSpinner message="Carregando..." /> : isError ? (
        <UIEmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={refetch} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={colors.primary} />}
          ListEmptyComponent={<UIEmptyState icon="users" title="Nenhum usuário encontrado" />}
          scrollEnabled={filtered.length > 0}
          renderItem={({ item: user }) => (
            <UICard
              variant="elevated"
              style={styles.userCard}
              onPress={() => router.push(`/admin/users/${user.id}`)}
              accessibilityLabel={`Abrir usuário ${user.name}`}
            >
              <UIAvatar name={user.name} imageBase64={user.avatarBase64} size={44} color={user.active ? colors.primary : colors.mutedForeground} />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: user.active ? colors.foreground : colors.mutedForeground }]}>{user.name}</Text>
                <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user.email}</Text>
              </View>
              <View style={styles.userMeta}>
                <UIBadge label={user.role === 'ADMIN' ? 'Admin' : 'Comercial'} color={user.role === 'ADMIN' ? colors.primary : colors.mutedForeground} size="sm" />
                {!user.active && <UIBadge label="Inativo" color={colors.danger} size="sm" />}
              </View>
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
  userCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  userEmail: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  userMeta: { gap: 4, alignItems: 'flex-end' },
});
