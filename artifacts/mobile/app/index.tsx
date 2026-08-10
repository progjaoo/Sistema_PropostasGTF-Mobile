import React, { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveAuthenticatedRoute } from '@/src/features/auth/routeGuard';
import { BrandLogo } from '@/src/ui';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useColors } from '@/hooks/useColors';

export default function IndexScreen() {
  const { initializeAuth, user, isInitialized } = useAuthStore();
  const insets = useSafeAreaInsets();
  const colors = useColors();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    router.replace(resolveAuthenticatedRoute(user?.role));
  }, [isInitialized, user]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: colors.background }]}>
      <BrandLogo variant="complete" width={132} height={92} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.foreground }]}>GTF Propostas</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Sistema Comercial GTF</Text>
      </View>
      <LoadingSpinner full={false} message="Carregando sessão..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    padding: 24,
  },
  copy: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Inter_800ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
});
