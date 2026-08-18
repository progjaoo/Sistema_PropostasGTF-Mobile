import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/src/theme';
import { UIBottomSheet } from './BottomSheet';
import { UIButton } from './Button';
import { UIInput } from './Input';

export interface TypedConfirmDialogProps {
  visible: boolean;
  title: string;
  resourceName: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function TypedConfirmDialog({
  visible,
  title,
  resourceName,
  description,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: TypedConfirmDialogProps) {
  const colors = useColors();
  const [typedName, setTypedName] = useState('');
  const expected = resourceName.trim();
  const canConfirm = useMemo(() => typedName.trim() === expected && expected.length > 0, [expected, typedName]);

  useEffect(() => {
    if (!visible) setTypedName('');
  }, [visible, resourceName]);

  return (
    <UIBottomSheet visible={visible} onClose={pending ? () => undefined : onCancel}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]} accessibilityLiveRegion="polite">
          {description}
        </Text>
        <UIInput
          label={`Digite ${resourceName} para confirmar`}
          accessibilityLabel={`Digite ${resourceName} para confirmar`}
          value={typedName}
          onChangeText={setTypedName}
          editable={!pending}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.actions}>
          <UIButton title="Cancelar" variant="outline" onPress={onCancel} disabled={pending} style={styles.action} />
          <UIButton
            title={pending ? 'Processando...' : confirmLabel}
            variant="destructive"
            onPress={onConfirm}
            disabled={!canConfirm || pending}
            style={styles.action}
          />
        </View>
      </View>
    </UIBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 14, lineHeight: 20, fontFamily: 'Inter_400Regular' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1 },
});
