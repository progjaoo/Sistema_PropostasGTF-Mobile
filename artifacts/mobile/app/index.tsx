import React, { useEffect } from 'react';
import { View, Image, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { resolveAuthenticatedRoute } from '@/src/features/auth/routeGuard';

export default function IndexScreen() {
  const { initializeAuth, user, isInitialized } = useAuthStore();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    router.replace(resolveAuthenticatedRoute(user?.role));
  }, [isInitialized, user]);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <Image
        source={require('@/assets/brand/gtf-logo-completa.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#1B4A8A" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  logo: {
    width: 220,
    height: 80,
  },
  spinner: {
    marginTop: 16,
  },
});
