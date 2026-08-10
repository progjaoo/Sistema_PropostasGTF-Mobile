import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { shadows, spacing, tokens } from '@/src/theme';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS: Record<ToastType, keyof typeof Feather.glyphMap> = {
  success: 'check-circle',
  error: 'alert-circle',
  warning: 'alert-triangle',
  info: 'info',
};

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const colors = useColors();
  const palette = {
    success: { bg: colors.success, text: colors.successForeground },
    error: { bg: colors.destructive, text: colors.destructiveForeground },
    warning: { bg: colors.warning, text: colors.warningForeground },
    info: { bg: colors.info, text: colors.infoForeground },
  }[toast.type];

  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => onRemove());
  }, []);

  return (
    <Animated.View style={[styles.toast, { backgroundColor: palette.bg, opacity }]}>
      <Feather name={TOAST_ICONS[toast.type]} size={18} color={palette.text} />
      <Text style={[styles.toastText, { color: palette.text }]} numberOfLines={3}>
        {toast.message}
      </Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();
  const idRef = useRef(0);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = String(++idRef.current);
    setToasts((prev) => [...prev.slice(-2), { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={[styles.container, { top: topInset + 12 }]} pointerEvents="none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    gap: spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: tokens.radius.lg,
    borderCurve: 'continuous',
    ...shadows.lg,
  },
  toastText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 20,
  },
});
