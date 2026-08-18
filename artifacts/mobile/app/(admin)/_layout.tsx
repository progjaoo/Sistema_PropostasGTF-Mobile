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
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="proposals">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Propostas</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="clients">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Clientes</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="alerts">
        <Icon sf={{ default: 'bell', selected: 'bell.fill' }} />
        <Label>Avisos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="menu">
        <Icon sf={{ default: 'line.3.horizontal', selected: 'line.3.horizontal' }} />
        <Label>Menu</Label>
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
      <Tabs.Screen name="index" options={{ title: 'Dashboard', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="chart.bar" tintColor={color} size={24} /> : <Feather name="bar-chart-2" size={22} color={color} /> }} />
      <Tabs.Screen name="proposals" options={{ title: 'Propostas', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="doc.text" tintColor={color} size={24} /> : <Feather name="file-text" size={22} color={color} /> }} />
      <Tabs.Screen name="clients" options={{ title: 'Clientes', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person.2" tintColor={color} size={24} /> : <Feather name="users" size={22} color={color} /> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Avisos', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="bell" tintColor={color} size={24} /> : <Feather name="bell" size={22} color={color} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'Menu', tabBarIcon: ({ color }) => isIOS ? <SymbolView name="line.3.horizontal" tintColor={color} size={24} /> : <Feather name="menu" size={22} color={color} /> }} />
    </Tabs>
  );
}

export default function AdminLayout() {
  const { user, isInitialized } = useAuthStore();
  if (!isInitialized) return <LoadingSpinner message="Carregando sessão..." />;
  if (user?.role !== 'ADMIN') return <Redirect href={user ? '/(comercial)' : '/(public)/login'} />;
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}