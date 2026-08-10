import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { showConfirm } from '@/components/ConfirmDialog';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall, getRefreshToken } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UICard, UIAvatar, UIButton, UIHeader, UISeparator } from '@/src/ui';
import { spacing } from '@/src/theme';

const MENU_SECTIONS = [
  {
    title: 'Cadastros',
    items: [
      { label: 'Usuários', icon: 'users' as const, route: '/admin/users', enabled: true },
      { label: 'Empresas', icon: 'radio' as const, route: '/admin/stations', enabled: true },
      { label: 'Origens de Leads', icon: 'map-pin' as const, route: '/admin/lead-sources', enabled: true },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { label: 'Programas', icon: 'layers' as const, route: '/admin/programs', enabled: true },
      { label: 'Produtos', icon: 'package' as const, route: '/admin/products', enabled: true },
      { label: 'Durações de Produto', icon: 'clock' as const, route: '/admin/product-durations', enabled: true },
      { label: 'Tipos de Proposta', icon: 'tag' as const, route: '/admin/proposal-types', enabled: true },
      { label: 'Modelos de Proposta', icon: 'copy' as const, route: '/admin/proposal-templates', enabled: true },
    ],
  },
];

export default function AdminMenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, clearAuth } = useAuthStore();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: bottomPad + 120 }}
    >
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <UIHeader
          title="Menu"
          subtitle="Configurações administrativas e dados da sua conta."
        />
      </View>

      {/* Profile mini */}
      <UICard
        variant="elevated"
        style={styles.profileCard}
        onPress={() => router.push('/admin/profile')}
        accessibilityLabel="Abrir meu perfil"
      >
        <UIAvatar name={user?.name} size={52} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <UIBadge label="ADMIN" variant="info" size="sm" style={styles.roleBadge} />
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </UICard>

      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title.toUpperCase()}</Text>
          <UICard variant="elevated" style={styles.sectionCard}>
            {section.items.map((item, idx) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={[styles.menuItem, !item.enabled && styles.menuItemDisabled]}
                  onPress={() => item.route && router.push(item.route as any)}
                  disabled={!item.enabled}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={item.enabled ? item.label : `${item.label}, em breve`}
                  accessibilityState={{ disabled: !item.enabled }}
                >
                  <View style={[styles.iconWrap, { backgroundColor: item.enabled ? colors.accent : colors.muted }]}>
                    <Feather name={item.icon} size={18} color={item.enabled ? colors.primary : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.menuLabel, { color: item.enabled ? colors.foreground : colors.mutedForeground }]}>{item.label}</Text>
                  {item.enabled ? (
                    <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                  ) : (
                    <View style={[styles.soonBadge, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.soonText, { color: colors.mutedForeground }]}>Em breve</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {idx < section.items.length - 1 && <UISeparator style={styles.divider} />}
              </React.Fragment>
            ))}
          </UICard>
        </View>
      ))}

      <UIButton
        variant="destructive"
        iconLeft="log-out"
        title="Sair do aplicativo"
        onPress={handleLogout}
        style={styles.logoutBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  profileCard: { flexDirection: 'row', alignItems: 'center', margin: 16, gap: 12 },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  roleBadge: { alignSelf: 'flex-start' },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  sectionCard: { padding: 0, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, minHeight: 60 },
  menuItemDisabled: { opacity: 0.8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  soonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  soonText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { marginLeft: 62 },
  logoutBtn: { marginHorizontal: spacing.xl, marginTop: spacing.lg },
});
