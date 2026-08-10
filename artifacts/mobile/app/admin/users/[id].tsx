import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { showConfirm } from '@/components/ConfirmDialog';
import { useToast } from '@/components/ToastProvider';
import { apiCall, ApiError } from '@/src/api/client';
import { Station, User, UserRole, UserStationAccess } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIButton, UICard, UIChip, UIHeader } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('COMERCIAL');
  const [active, setActive] = useState(true);
  const [stationAccesses, setStationAccesses] = useState<UserStationAccess[]>([]);
  const [isDirty, setIsDirty] = useState(isNew);

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiCall<User>('GET', `/users/${id}`),
    enabled: !isNew && !!id,
    staleTime: 30000,
  });

  const { data: stations, isLoading: stationsLoading, isError: stationsError, refetch: refetchStations } = useQuery({
    queryKey: ['stations'],
    queryFn: () => apiCall<Station[]>('GET', '/stations'),
    staleTime: 60000,
    select: (data) => data.filter((station) => station.active),
  });

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setEmail(user.email ?? '');
      setRole(user.role ?? 'COMERCIAL');
      setActive(user.active ?? true);
      setStationAccesses(user.stationAccesses ?? []);
    }
  }, [user?.id]);

  const getStationAccess = (stationId: string): UserStationAccess => {
    const existing = stationAccesses.find((access) => access.stationId === stationId);
    return existing ?? {
      stationId,
      canCreateProposals: false,
      canViewCatalog: false,
      active: false,
    };
  };

  const updateStationAccess = (stationId: string, patch: Partial<UserStationAccess>) => {
    setStationAccesses((current) => {
      const existing = current.find((access) => access.stationId === stationId);
      const nextAccess: UserStationAccess = {
        stationId,
        canCreateProposals: false,
        canViewCatalog: false,
        active: false,
        ...existing,
        ...patch,
      };
      const normalizedAccess = {
        ...nextAccess,
        canCreateProposals: nextAccess.active ? nextAccess.canCreateProposals : false,
        canViewCatalog: nextAccess.active ? nextAccess.canViewCatalog : false,
      };
      if (existing) {
        return current.map((access) => access.stationId === stationId ? normalizedAccess : access);
      }
      return [...current, normalizedAccess];
    });
    setIsDirty(true);
  };

  const buildStationAccessPayload = () => {
    if (role === 'ADMIN') return [];
    return stationAccesses
      .filter((access) => access.active)
      .map((access) => ({
        stationId: access.stationId,
        canCreateProposals: access.canCreateProposals,
        canViewCatalog: access.canViewCatalog,
        active: true,
      }));
  };

  const validateBeforeSave = () => {
    if (!name.trim()) return 'Informe o nome.';
    if (!/\S+@\S+\.\S+/.test(email.trim())) return 'Informe um e-mail válido.';
    if (isNew && password.length < 8) return 'A senha deve ter pelo menos 8 caracteres.';
    if (role === 'COMERCIAL' && active && !buildStationAccessPayload().some((access) => access.canCreateProposals)) {
      return 'Comercial ativo precisa ter acesso para criar propostas em ao menos uma empresa.';
    }
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const validationError = validateBeforeSave();
      if (validationError) throw new ApiError(400, validationError);
      const stationAccessesPayload = buildStationAccessPayload();
      if (isNew) {
        return apiCall<User>('POST', '/users', { name: name.trim(), email: email.trim().toLowerCase(), password, role, active, stationAccesses: stationAccessesPayload });
      }
      return apiCall<User>('PATCH', `/users/${id}`, { name: name.trim(), email: email.trim().toLowerCase(), role, active, stationAccesses: stationAccessesPayload });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', data.id] });
      queryClient.invalidateQueries({ queryKey: ['stations-for-new'] });
      setIsDirty(false);
      showToast(isNew ? 'Usuário criado!' : 'Usuário atualizado!', 'success');
      if (isNew) router.replace(`/admin/users/${data.id}`);
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Erro ao salvar.', 'error'),
  });

  const deactivateMutation = useMutation({
    mutationFn: () => apiCall('DELETE', `/users/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('Usuário desativado.', 'info');
      router.back();
    },
    onError: (err) => showToast(err instanceof ApiError ? err.message : 'Erro ao desativar.', 'error'),
  });

  if (!isNew && isLoading) return <LoadingSpinner message="Carregando..." />;

  return (
    <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingBottom: bottomPad + 40 }} keyboardShouldPersistTaps="handled" bottomOffset={20}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title={isNew ? 'Novo Usuário' : user?.name ?? 'Usuário'}
          subtitle="Defina perfil, status e empresas permitidas."
          style={styles.headerCopy}
        />
        {isDirty && (
          <UIButton title={saveMutation.isPending ? 'Salvando' : 'Salvar'} size="sm" onPress={() => saveMutation.mutate()} disabled={saveMutation.isPending} />
        )}
      </View>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DADOS</Text>
        <FormInput label="Nome" required leftIcon="user" value={name} onChangeText={(t) => { setName(t); setIsDirty(true); }} />
        <FormInput label="E-mail" required leftIcon="mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={(t) => { setEmail(t); setIsDirty(true); }} />
        {isNew && <FormInput label="Senha" required leftIcon="lock" isPassword value={password} onChangeText={(t) => { setPassword(t); setIsDirty(true); }} hint="Mínimo 8 caracteres." />}
      </UICard>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PERFIL</Text>
        <View style={styles.toggleRow}>
          {(['ADMIN', 'COMERCIAL'] as UserRole[]).map((r) => (
            <UIChip
              key={r}
              label={r === 'ADMIN' ? 'Administrador' : 'Comercial'}
              active={role === r}
              style={styles.roleChip}
              onPress={() => { setRole(r); setIsDirty(true); }}
            />
          ))}
        </View>
        <Pressable
          style={[styles.activeRow, { borderColor: colors.border }]}
          onPress={() => { setActive((value) => !value); setIsDirty(true); }}
          accessibilityRole="switch"
          accessibilityState={{ checked: active }}
        >
          <View style={styles.activeTextWrap}>
            <Text style={[styles.activeTitle, { color: colors.foreground }]}>Usuário ativo</Text>
            <Text style={[styles.activeHint, { color: colors.mutedForeground }]}>Usuário inativo não consegue fazer login.</Text>
          </View>
          <View style={[styles.switchTrack, { backgroundColor: active ? colors.primary : colors.muted }]}>
            <View style={[styles.switchThumb, active && styles.switchThumbOn]} />
          </View>
        </Pressable>
      </UICard>

      {role === 'COMERCIAL' && (
        <UICard variant="elevated" style={styles.form}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ACESSO ÀS EMPRESAS</Text>
          {stationsLoading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={[styles.inlineText, { color: colors.mutedForeground }]}>Carregando empresas...</Text>
            </View>
          ) : stationsError ? (
            <Pressable style={[styles.retryAccess, { borderColor: colors.border }]} onPress={() => refetchStations()} accessibilityRole="button">
              <Feather name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.retryAccessText, { color: colors.foreground }]}>Erro ao carregar empresas. Tocar para tentar novamente.</Text>
            </Pressable>
          ) : (stations ?? []).length === 0 ? (
            <Text style={[styles.inlineText, { color: colors.mutedForeground }]}>Nenhuma empresa ativa cadastrada.</Text>
          ) : (
            (stations ?? []).map((station) => {
              const access = getStationAccess(station.id);
              return (
                <UICard key={station.id} variant="muted" style={styles.accessCard}>
                  <Pressable
                    style={styles.accessHeader}
                    onPress={() => updateStationAccess(station.id, {
                      active: !access.active,
                      canCreateProposals: !access.active ? true : false,
                      canViewCatalog: !access.active ? true : false,
                    })}
                    accessibilityRole="switch"
                    accessibilityLabel={`Acesso à empresa ${station.name}`}
                    accessibilityState={{ checked: access.active }}
                  >
                    <View style={[styles.stationDot, { backgroundColor: station.primaryColor ?? colors.primary }]} />
                    <Text style={[styles.accessStationName, { color: colors.foreground }]}>{station.name}</Text>
                    <View style={[styles.switchTrack, { backgroundColor: access.active ? colors.primary : colors.muted }]}>
                      <View style={[styles.switchThumb, access.active && styles.switchThumbOn]} />
                    </View>
                  </Pressable>
                  {access.active && (
                    <View style={styles.permissionRow}>
                      <UIChip
                        label="Criar propostas"
                        icon={access.canCreateProposals ? 'check-circle' : 'circle'}
                        active={access.canCreateProposals}
                        onPress={() => updateStationAccess(station.id, { canCreateProposals: !access.canCreateProposals })}
                      />
                      <UIChip
                        label="Ver catálogo"
                        icon={access.canViewCatalog ? 'check-circle' : 'circle'}
                        active={access.canViewCatalog}
                        onPress={() => updateStationAccess(station.id, { canViewCatalog: !access.canViewCatalog })}
                      />
                    </View>
                  )}
                </UICard>
              );
            })
          )}
        </UICard>
      )}

      {!isNew && (
        <View style={{ padding: 20, gap: 12 }}>
          {user?.active && (
            <UIButton
              variant="destructive"
              iconLeft="user-x"
              title="Desativar usuário"
              onPress={() => showConfirm({ title: 'Desativar usuário', message: 'O usuário será desativado e não poderá mais fazer login.', confirmText: 'Desativar', destructive: true, onConfirm: () => deactivateMutation.mutate() })}>
            </UIButton>
          )}
        </View>
      )}

      {isNew && (
        <View style={{ padding: 20 }}>
          <UIButton title={saveMutation.isPending ? 'Criando usuário' : 'Criar usuário'} size="lg" onPress={() => saveMutation.mutate()} disabled={!name.trim() || !email.trim() || !password || saveMutation.isPending} />
        </View>
      )}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  headerCopy: { flex: 1 },
  form: { margin: spacing.md, marginBottom: 0, gap: spacing.lg },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  roleChip: { flex: 1 },
  activeRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14, gap: 12 },
  activeTextWrap: { flex: 1, gap: 2 },
  activeTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  activeHint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  switchTrack: { width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center' },
  switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFF' },
  switchThumbOn: { alignSelf: 'flex-end' },
  inlineLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  inlineText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  retryAccess: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  retryAccessText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  accessCard: { gap: spacing.sm },
  accessHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stationDot: { width: 12, height: 12, borderRadius: 6 },
  accessStationName: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  permissionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingLeft: 22 },
});
