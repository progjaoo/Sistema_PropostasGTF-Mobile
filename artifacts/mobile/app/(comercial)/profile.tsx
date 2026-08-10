import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { FormInput } from '@/components/FormInput';
import { ImagePickerField } from '@/components/ImagePickerField';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall, ApiError, getRefreshToken } from '@/src/api/client';
import { AuthUser } from '@/src/types';
import { getInitials } from '@/src/utils/format';
import { useColors } from '@/hooks/useColors';

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

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;
  const initials = getInitials(user?.name);

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Meu Perfil</Text>
        {isDirty && (
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }, saveMutation.isPending && styles.disabled]}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Avatar */}
      <View style={[styles.avatarSection, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {user?.role === 'ADMIN' ? 'Administrador' : 'Comercial'}
            </Text>
          </View>
        </View>
      </View>

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
      <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
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
      </View>

      <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
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
      </View>

      <View style={[styles.form, { backgroundColor: colors.card, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ACESSO</Text>
        <View style={styles.readOnlyRow}>
          <Feather name="mail" size={16} color={colors.mutedForeground} />
          <Text style={[styles.readOnlyLabel, { color: colors.mutedForeground }]}>E-mail de login</Text>
          <Text style={[styles.readOnlyValue, { color: colors.foreground }]} numberOfLines={1}>{user?.email}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.destructive + '40', backgroundColor: colors.destructive + '08' }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sair do aplicativo</Text>
      </TouchableOpacity>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  saveBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: '#FFF' },
  disabled: { opacity: 0.7 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 16, borderBottomWidth: 1 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  userInfo: { flex: 1, gap: 4 },
  userName: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  roleText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, margin: 16, padding: 14, borderRadius: 10, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  form: { padding: 20, gap: 16, borderTopWidth: 1, borderBottomWidth: 1, marginTop: 12 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5 },
  readOnlyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  readOnlyLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', width: 100 },
  readOnlyValue: { fontSize: 14, fontFamily: 'Inter_500Medium', flex: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 14, borderRadius: 12, borderWidth: 1 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
