import React from 'react';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { pickImageDataUrl } from '@/src/utils/imagePicker';

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
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.card }]}>
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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Selecionar ${label}`}
          style={[styles.button, { borderColor: colors.primary }]}
          onPress={handlePick}
          disabled={pending}
        >
          {pending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="upload" size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>
      {!!value && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Remover ${label}`}
          style={styles.remove}
          onPress={() => onChange(null)}
          disabled={pending}
        >
          <Feather name="trash-2" size={15} color={colors.destructive} />
          <Text style={[styles.removeText, { color: colors.destructive }]}>Remover imagem</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  card: { minHeight: 82, borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 58, height: 58, borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  circlePreview: { borderRadius: 29 },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 15 },
  button: { width: 42, height: 42, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  remove: { minHeight: 36, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6 },
  removeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
