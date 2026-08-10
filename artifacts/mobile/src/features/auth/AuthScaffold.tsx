import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { BrandLogo } from '@/src/ui';
import { spacing, tokens } from '@/src/theme';

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
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + (showBrand ? 32 : 16), paddingBottom: bottomPad + 24 },
        contentStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      {showBrand ? (
        <View style={styles.brand}>
          <BrandLogo variant="complete" width={124} height={86} />
          <View style={styles.brandCopy}>
            <Text style={[styles.brandTitle, { color: colors.foreground }]}>GTF Propostas</Text>
            <Text style={[styles.brandSubtitle, { color: colors.mutedForeground }]}>Sistema Comercial GTF</Text>
          </View>
        </View>
      ) : null}

      {(title || subtitle || showBack) ? (
        <View style={styles.header}>
          {showBack ? (
            <Pressable
              onPress={onBack ?? (() => router.back())}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="arrow-left" size={20} color={colors.foreground} />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            {title ? <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text> : null}
            {subtitle ? <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
          </View>
        </View>
      ) : null}

      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  brandCopy: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  brandTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Inter_800ExtraBold',
  },
  brandSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_500Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: tokens.radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: 'Inter_800ExtraBold',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    alignItems: 'center',
  },
});
