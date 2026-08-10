import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { showConfirm } from '@/components/ConfirmDialog';
import { useAuthStore } from '@/src/store/authStore';
import { apiCall, getRefreshToken } from '@/src/api/client';
import { getInitials } from '@/src/utils/format';
import { useColors } from '@/hooks/useColors';

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
  const initials = getInitials(user?.name);

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
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Menu</Text>
      </View>

      {/* Profile mini */}
      <TouchableOpacity
        style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push('/admin/profile')}
        activeOpacity={0.7}
      >
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.foreground }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>ADMIN</Text>
          </View>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      {MENU_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{section.title.toUpperCase()}</Text>
          <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                {idx < section.items.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.destructive + '40', backgroundColor: colors.destructive + '08' }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>Sair do aplicativo</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 24, fontFamily: 'Inter_700Bold' },
  profileCard: { flexDirection: 'row', alignItems: 'center', margin: 16, padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  profileInfo: { flex: 1, gap: 3 },
  profileName: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  profileEmail: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99 },
  roleText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: 8, marginTop: 16 },
  sectionCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuItemDisabled: { opacity: 0.8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  soonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  soonText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  divider: { height: 1, marginLeft: 62 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, margin: 20, padding: 14, borderRadius: 12, borderWidth: 1 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
