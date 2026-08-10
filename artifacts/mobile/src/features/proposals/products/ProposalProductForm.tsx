import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { ProposalProduct } from '@/src/types';
import { useColors } from '@/hooks/useColors';

const SEASONS: Array<{ value: ProposalProduct['seasonality']; label: string }> = [
  { value: null, label: 'Sem sazonalidade' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
];

const PRODUCT_COLORS = [
  { value: 'BLUE', label: 'Azul', color: '#427EFF' },
  { value: 'YELLOW', label: 'Amarelo', color: '#F59E0B' },
  { value: 'RED', label: 'Vermelho', color: '#EF4444' },
  { value: 'GREEN', label: 'Verde', color: '#22C55E' },
  { value: 'DARK', label: 'Escuro', color: '#1E293B' },
];

export function ProposalProductForm({
  product,
  visible,
  onClose,
  onSave,
  pending = false,
}: {
  product: ProposalProduct | null;
  visible: boolean;
  onClose: () => void;
  onSave: (product: ProposalProduct) => void;
  pending?: boolean;
}) {
  const colors = useColors();
  const [draft, setDraft] = useState<ProposalProduct | null>(product);
  useEffect(() => setDraft(product), [product]);
  if (!draft) return null;
  const field = (key: keyof ProposalProduct, placeholder: string, multiline = false) => (
    <TextInput
      style={[styles.input, multiline && styles.multiline, { color: colors.foreground, borderColor: colors.border }]}
      placeholder={placeholder}
      placeholderTextColor={colors.mutedForeground}
      multiline={multiline}
      value={String(draft[key] ?? '')}
      onChangeText={(value) => setDraft({ ...draft, [key]: value })}
    />
  );
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
          <Text style={[styles.title, { color: colors.foreground }]}>Dados do produto</Text>
          <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
            {field('title', 'Nome do produto')}
            {field('qty', 'Quantidade')}
            {field('durationLabel', 'Duracao, ex: 30s')}
            {field('airTime', 'Horario, ex: 13h as 15h')}
            {field('detail', 'Detalhe, ex: 60 segundos - diariamente')}
            {field('description', 'Descricao', true)}
            {field('program', 'Nome do programa')}
            <View style={styles.colorGroup}>
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Cor do card</Text>
              <View style={styles.colors}>
                {PRODUCT_COLORS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: draft.color === option.value }}
                    style={[
                      styles.colorOption,
                      { borderColor: draft.color === option.value ? option.color : colors.border },
                    ]}
                    onPress={() => setDraft({ ...draft, color: option.value })}
                  >
                    <View style={[styles.colorDot, { backgroundColor: option.color }]} />
                    <Text style={[styles.colorLabel, { color: colors.foreground }]}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.seasons}>
              {SEASONS.map((season) => (
                <TouchableOpacity key={String(season.value)} style={[styles.season, { borderColor: draft.seasonality === season.value ? colors.primary : colors.border }]} onPress={() => setDraft({ ...draft, seasonality: season.value })}>
                  <Text style={{ color: colors.foreground }}>{season.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <TouchableOpacity
            disabled={pending}
            style={[styles.save, { backgroundColor: colors.primary, opacity: pending ? 0.6 : 1 }]}
            onPress={() => onSave(draft)}
          >
            <Text style={styles.saveText}>{pending ? 'Salvando...' : 'Salvar produto'}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  sheet: { maxHeight: '90%', padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  form: { gap: 10 },
  input: { minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: 'Inter_400Regular' },
  multiline: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  colorGroup: { gap: 8 },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  colorOption: { minHeight: 40, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  colorLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  seasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  season: { minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  save: { minHeight: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontFamily: 'Inter_600SemiBold' },
});
