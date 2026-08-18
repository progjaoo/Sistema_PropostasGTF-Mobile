import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProposalProduct } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIBottomSheet, UIButton, UIChip, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';
import { formatCentsBRL, formatMoneyInput, parseQuantity, productSubtotalCents } from './proposalProductMoney';

const SEASONS: Array<{ value: ProposalProduct['seasonality']; label: string }> = [
  { value: null, label: 'Sem sazonalidade' },
  { value: 'MONTHLY', label: 'Mensal' },
  { value: 'SEMIANNUAL', label: 'Semestral' },
  { value: 'ANNUAL', label: 'Anual' },
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
    <UIInput
      containerStyle={multiline ? styles.multilineContainer : undefined}
      style={multiline ? styles.multiline : undefined}
      placeholder={placeholder}
      multiline={multiline}
      value={String(draft[key] ?? '')}
      onChangeText={(value) => setDraft({ ...draft, [key]: value })}
    />
  );
  return (
    <UIBottomSheet visible={visible} onClose={onClose} style={styles.sheet}>
      <Text style={[styles.title, { color: colors.foreground }]}>Dados do produto</Text>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {field('title', 'Nome do produto')}
        <View style={styles.quantityRow}><UIInput containerStyle={styles.quantityInput} label="Quantidade (1–9999)" keyboardType="number-pad" value={String(parseQuantity(draft.qty))} onChangeText={(value) => setDraft({ ...draft, qty: String(parseQuantity(value)) })} /><View style={styles.stepper}><UIButton title="−" size="sm" variant="outline" onPress={() => setDraft({ ...draft, qty: String(Math.max(1, parseQuantity(draft.qty) - 1)) })} /><UIButton title="+" size="sm" variant="outline" onPress={() => setDraft({ ...draft, qty: String(Math.min(9999, parseQuantity(draft.qty) + 1)) })} /></View></View>
        <UIInput label="Valor unitário" placeholder="R$ 0,00" keyboardType="decimal-pad" value={String(draft.unitValue ?? '')} onChangeText={(value) => setDraft({ ...draft, unitValue: formatMoneyInput(value) })} />
        {field('durationLabel', 'Duração, ex: 30s')}
        {field('airTime', 'Horário, ex: 13h às 15h')}
        {field('detail', 'Detalhe, ex: 60 segundos - diariamente')}
        {field('description', 'Descrição', true)}
        {field('program', 'Nome do programa')}
        <Text style={[styles.subtotal, { color: colors.foreground }]}>Subtotal: {formatCentsBRL(productSubtotalCents(draft))}</Text>
        <View style={styles.seasons}>
          {SEASONS.map((season) => (
            <UIChip
              key={String(season.value)}
              label={season.label}
              active={draft.seasonality === season.value}
              onPress={() => setDraft({ ...draft, seasonality: season.value })}
            />
          ))}
        </View>
      </ScrollView>
      <UIButton
        disabled={pending}
        title={pending ? 'Salvando...' : 'Salvar produto'}
        onPress={() => onSave(draft)}
      />
    </UIBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: { maxHeight: '90%' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 22 },
  form: { gap: spacing.sm },
  multilineContainer: { minHeight: 92 },
  multiline: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  seasons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  quantityInput: { flex: 1 },
  stepper: { flexDirection: 'row', gap: spacing.xs, paddingBottom: 2 },
  subtotal: { fontFamily: 'Inter_700Bold', fontSize: 15 },
});
