import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { ImagePickerField } from '@/components/ImagePickerField';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall, ApiError, getRefreshToken } from '@/src/api/client';
import { AuthUser } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UICard, UIAvatar, UIButton, UIHeader } from '@/src/ui';
import { shadows, spacing, tokens } from '@/src/theme';
import { getProfileFallbackRoute } from '@/src/features/auth/profileNavigation';

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, clearAuth, updateUser } = useAuthStore();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? '');
  const [contactPhone, setContactPhone] = useState(user?.contactPhone ?? '');
  const [contactEmail, setContactEmail] = useState(user?.contactEmail ?? '');
  const [avatarBase64, setAvatarBase64] = useState(user?.avatarBase64 ?? null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setJobTitle(user.jobTitle ?? '');
      setContactPhone(user.contactPhone ?? '');
      setContactEmail(user.contactEmail ?? '');
      setAvatarBase64(user.avatarBase64 ?? null);
    }
  }, [user?.id]);

  const markDirty = () => setIsDirty(true);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiCall<AuthUser>('PATCH', '/profile', {
        name: name.trim(),
        jobTitle: jobTitle.trim() || null,
        contactPhone: contactPhone.trim() || null,
        contactEmail: contactEmail.trim() || null,
        avatarBase64,
      }),
    onSuccess: (data) => {
      updateUser(data);
      setIsDirty(false);
      showToast('Perfil atualizado!', 'success');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Erro ao salvar perfil.';
      showToast(msg, 'error');
    },
  });

  const handleLogout = () => {
    showConfirm({
      title: 'Sair',
      message: 'Deseja sair do aplicativo?',
      confirmText: 'Sair',
      destructive: true,
      onConfirm: async () => {
        try {
          const rt = await getRefreshToken();
          await apiCall('POST', '/auth/mobile/logout', { refreshToken: rt });
        } catch {}
        await clearAuth();
        router.replace('/(public)/login');
      },
    });
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(getProfileFallbackRoute(user?.role));
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <UIHeader
            title="Meu Perfil"
            subtitle="Atualize seus dados comerciais usados nas propostas."
            style={styles.profileHeader}
            action={isDirty ? (
              <UIButton
                title={saveMutation.isPending ? undefined : 'Salvar'}
                size="sm"
                onPress={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                accessibilityState={{ disabled: saveMutation.isPending, busy: saveMutation.isPending }}
              >
                {saveMutation.isPending ? <ActivityIndicator size="small" color={colors.primaryForeground} /> : undefined}
              </UIButton>
            ) : undefined}
          />
        </View>
      </View>

      {/* Avatar */}
      <UICard variant="elevated" style={styles.avatarSection}>
        <UIAvatar name={user?.name} imageBase64={avatarBase64} size={70} />
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <UIBadge label={user?.role === 'ADMIN' ? 'Administrador' : 'Comercial'} variant="info" size="sm" style={styles.roleBadge} />
        </View>
      </UICard>

      {/* Contact info warning */}
      {(!user?.jobTitle || !user?.contactPhone) && (
        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
          <Feather name="alert-triangle" size={16} color={colors.warning} />
          <Text style={[styles.warningText, { color: colors.warning }]}>
            Complete cargo e telefone para que apareçam nas propostas.
          </Text>
        </View>
      )}

      {/* Form */}
      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DADOS PESSOAIS</Text>
        <ImagePickerField
          label="Foto do perfil"
          value={avatarBase64}
          previewShape="circle"
          emptyText="Nenhuma foto cadastrada"
          pending={saveMutation.isPending}
          onChange={(value) => { setAvatarBase64(value); markDirty(); }}
          onError={(message) => showToast(message, 'warning')}
        />
        <FormInput
          label="Nome" required leftIcon="user" placeholder="Seu nome"
          value={name} onChangeText={(t) => { setName(t); markDirty(); }}
        />
        <FormInput
          label="Cargo" leftIcon="briefcase" placeholder="Ex: Gerente Comercial"
          value={jobTitle} onChangeText={(t) => { setJobTitle(t); markDirty(); }}
          hint="Aparece no rodapé das propostas."
        />
      </UICard>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>CONTATO COMERCIAL</Text>
        <FormInput
          label="Telefone" leftIcon="phone" placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
          value={contactPhone} onChangeText={(t) => { setContactPhone(t); markDirty(); }}
          hint="Número de contato que aparece nas propostas."
        />
        <FormInput
          label="E-mail comercial" leftIcon="mail" placeholder="contato@empresa.com"
          keyboardType="email-address" autoCapitalize="none"
          value={contactEmail} onChangeText={(t) => { setContactEmail(t); markDirty(); }}
        />
      </UICard>

      <UICard variant="elevated" style={styles.form}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACESSO</Text>
        <View style={styles.readOnlyRow}>
          <Feather name="mail" size={16} color={colors.mutedForeground} />
          <Text style={[styles.readOnlyLabel, { color: colors.mutedForeground }]}>E-mail de login</Text>
          <Text style={[styles.readOnlyValue, { color: colors.foreground }]} numberOfLines={1}>{user?.email}</Text>
        </View>
      </UICard>

      <UIButton
        variant="destructive"
        iconLeft="log-out"
        title="Sair do aplicativo"
        onPress={handleLogout}
        style={styles.logoutBtn}
      />
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  profileHeader: { flex: 1 },
  backButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: tokens.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  avatarSection: { flexDirection: 'row', alignItems: 'center', margin: 16, gap: 16 },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  roleBadge: { alignSelf: 'flex-start' },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, margin: 16, padding: 14, borderRadius: 10, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  form: { marginHorizontal: 16, marginTop: 12, gap: 16 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readOnlyLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', width: 100 },
  readOnlyValue: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  logoutBtn: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
});
