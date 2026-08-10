import React from 'react';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { pickImageDataUrl } from '@/src/utils/imagePicker';
import { UIButton, UICard } from '@/src/ui';
import { spacing } from '@/src/theme';

interface Props {
  label: string;
  value?: string | null;
  emptyText: string;
  previewShape?: 'circle' | 'rounded';
  pending?: boolean;
  onChange: (dataUrl: string | null) => void;
  onError: (message: string) => void;
}

export function ImagePickerField({
  label,
  value,
  emptyText,
  previewShape = 'rounded',
  pending,
  onChange,
  onError,
}: Props) {
  const colors = useColors();

  const handlePick = async () => {
    try {
      const image = await pickImageDataUrl();
      if (image) onChange(image.dataUrl);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Nao foi possivel selecionar a imagem.');
    }
  };

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <UICard variant="outlined" style={styles.card}>
        <View
          style={[
            styles.preview,
            { backgroundColor: colors.muted },
            previewShape === 'circle' && styles.circlePreview,
          ]}
        >
          {value ? (
            <Image source={{ uri: value }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <Feather name="image" size={22} color={colors.mutedForeground} />
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.foreground }]}>{value ? 'Imagem selecionada' : emptyText}</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            PNG, JPEG ou WebP em base64. Limite validado pela API.
          </Text>
        </View>
        <UIButton
          variant="outline"
          iconLeft={pending ? undefined : 'upload'}
          size="sm"
          accessibilityRole="button"
          accessibilityLabel={`Selecionar ${label}`}
          style={styles.button}
          onPress={handlePick}
          disabled={pending}
        >
          {pending ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </UIButton>
      </UICard>
      {!!value && (
        <UIButton
          variant="ghost"
          iconLeft="trash-2"
          title="Remover imagem"
          size="sm"
          accessibilityRole="button"
          accessibilityLabel={`Remover ${label}`}
          style={styles.remove}
          iconColor={colors.destructive}
          textStyle={{ color: colors.destructive }}
          onPress={() => onChange(null)}
          disabled={pending}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  card: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  preview: { width: 58, height: 58, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  circlePreview: { borderRadius: 29 },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  button: { width: 44, paddingHorizontal: 0 },
  remove: { alignSelf: 'flex-start' },
});
