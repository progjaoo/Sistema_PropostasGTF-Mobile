import React from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/src/store/authStore';
import { shadows, spacing, tokens } from '@/src/theme';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { createNativeTabTheme, createTabScreenOptions } from '@/src/navigation/tabTheme';

function NativeTabLayout() {
  const colors = useColors();
  const nativeTabTheme = createNativeTabTheme(colors);
  return (
    <NativeTabs {...nativeTabTheme}>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Propostas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clients">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Clientes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="products">
        <Icon sf={{ default: 'shippingbox', selected: 'shippingbox.fill' }} />
        <Label>Produtos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="contracts">
        <Icon sf={{ default: 'signature', selected: 'signature' }} />
        <Label>Contratos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="more">
        <Icon sf={{ default: 'ellipsis.circle', selected: 'ellipsis.circle.fill' }} />
        <Label>Mais</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        ...createTabScreenOptions(colors),
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: 72 + safeAreaInsets.bottom,
          marginHorizontal: isWeb ? 0 : spacing.lg,
          marginBottom: isWeb ? 0 : Math.max(safeAreaInsets.bottom, spacing.sm),
          paddingBottom: isWeb ? safeAreaInsets.bottom : Math.max(safeAreaInsets.bottom, spacing.sm),
          borderRadius: isWeb ? 0 : tokens.radius.full,
          borderCurve: 'continuous',
          overflow: 'hidden',
          ...(isWeb ? {} : shadows.lg),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Propostas',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="doc.text" tintColor={color} size={24} /> : <Feather name="file-text" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: 'Clientes',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.2" tintColor={color} size={24} /> : <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="products" options={{ title: 'Produtos', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="shippingbox" tintColor={color} size={24} /> : <Feather name="package" size={22} color={color} /> }} />
      <Tabs.Screen name="contracts" options={{ title: 'Contratos', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="signature" tintColor={color} size={24} /> : <Feather name="file-text" size={22} color={color} /> }} />
      <Tabs.Screen name="more" options={{ title: 'Mais', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="ellipsis.circle" tintColor={color} size={24} /> : <Feather name="more-horizontal" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function ComercialLayout() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return <LoadingSpinner message="Carregando sessão..." />;
  if (!user) return <Redirect href="/(public)/login" />;
  if (user.role === 'ADMIN') return <Redirect href="/(admin)" />;
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
