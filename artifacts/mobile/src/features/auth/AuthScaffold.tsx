import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { BrandLogo } from '@/src/ui';
import { spacing } from '@/src/theme';
import { BRAND } from '@/src/config/brand';

type AuthScaffoldProps = {
  title?: string;
  subtitle?: string;
  showBrand?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AuthScaffold({
  title,
  subtitle,
  showBrand = false,
  showBack = false,
  onBack,
  children,
  footer,
  contentStyle,
}: AuthScaffoldProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollViewCompat
        style={{ flex: 1, backgroundColor: colors.primary }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        {/* Header Superior em Laranja com M maiúsculo */}
        <View style={[styles.headerBg, { paddingTop: topPad + 24, backgroundColor: colors.primary }]}>
          {showBack ? (
            <Pressable
              onPress={onBack ?? (() => router.back())}
              hitSlop={10}
              style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="arrow-left" size={22} color="#FFF" />
            </Pressable>
          ) : null}

          {showBrand ? (
            <View style={styles.brandContainer}>
              <BrandLogo variant="icon" size={68} />
              <BrandLogo variant="logo" width={118} height={20} style={{ marginTop: 8 }} />
              <View style={styles.srOnly}>
                <Text>{BRAND.productName}</Text>
                <Text>{BRAND.systemName}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Card Branco Estilo Sheet Solta */}
        <View
          style={[
            styles.sheetCard,
            { backgroundColor: colors.card, paddingBottom: bottomPad + 24 },
            contentStyle,
          ]}
        >
          {(title || subtitle) ? (
            <View style={styles.copyContainer}>
              {title ? <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text> : null}
              {subtitle ? <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
            </View>
          ) : null}

          {children}

          {footer ? <View style={styles.footerContainer}>{footer}</View> : null}
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBg: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  srOnly: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    overflow: 'hidden',
  },
  sheetCard: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 20,
  },
  copyContainer: {
    gap: 6,
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
  },
  footerContainer: {
    marginTop: 'auto',
    paddingTop: 16,
    alignItems: 'center',
  },
});

