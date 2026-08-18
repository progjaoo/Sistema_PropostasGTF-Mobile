import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CommercialContract, EligibleContractProposal } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { UIButton, UICard, UIChip, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

export function ContractForm({ contract, eligible, pending, onSubmit, onCancel }: { contract?: CommercialContract | null; eligible: EligibleContractProposal[]; pending: boolean; onSubmit: (value: { proposalId: string; monthlyValue: string; saleDate: string; startDate: string; endDate: string; installmentDueDay: number; notes?: string | null }) => void; onCancel: () => void }) {
  const colors = useColors();
  const [proposalId, setProposalId] = useState(contract?.proposalId ?? '');
  const [monthlyValue, setMonthlyValue] = useState(contract?.monthlyValue ?? '');
  const [saleDate, setSaleDate] = useState(contract?.saleDate ?? '');
  const [startDate, setStartDate] = useState(contract?.startDate ?? '');
  const [endDate, setEndDate] = useState(contract?.endDate ?? '');
  const [dueDay, setDueDay] = useState(String(contract?.installmentDueDay ?? 10));
  const [notes, setNotes] = useState(contract?.notes ?? '');
  const selected = eligible.find((item) => item.id === proposalId);
  const dueDayNumber = Number(dueDay);
  const canSubmit = Boolean(monthlyValue.trim() && saleDate.trim() && startDate.trim() && endDate.trim() && Number.isInteger(dueDayNumber) && dueDayNumber >= 1 && dueDayNumber <= 31 && (contract || proposalId));
  return <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"><UICard variant="elevated" style={styles.card}><Text style={[styles.title, { color: colors.foreground }]}>{contract ? 'Editar contrato' : 'Novo contrato'}</Text>{!contract && <><Text style={[styles.label, { color: colors.mutedForeground }]}>Proposta aprovada</Text><ScrollView horizontal contentContainerStyle={styles.chips}>{eligible.map((item) => <UIChip key={item.id} label={item.advertiserName ?? item.proposalName ?? item.id} active={proposalId === item.id} onPress={() => setProposalId(item.id)} />)}</ScrollView>{selected && <Text style={[styles.hint, { color: colors.mutedForeground }]}>{selected.proposalName} · {selected.stationName ?? 'Empresa'}</Text>}</>}<UIInput label="Valor mensal" placeholder="R$ 2.000,00" keyboardType="decimal-pad" value={monthlyValue} onChangeText={setMonthlyValue} /><UIInput label="Data da venda" placeholder="AAAA-MM-DD" value={saleDate} onChangeText={setSaleDate} /><UIInput label="Início" placeholder="AAAA-MM-DD" value={startDate} onChangeText={setStartDate} /><UIInput label="Encerramento" placeholder="AAAA-MM-DD" value={endDate} onChangeText={setEndDate} /><UIInput label="Dia de vencimento (1–31)" keyboardType="number-pad" value={dueDay} onChangeText={setDueDay} /><UIInput label="Observações" multiline value={notes} onChangeText={setNotes} /><View style={styles.actions}><UIButton variant="outline" title="Cancelar" onPress={onCancel} disabled={pending} style={styles.action} /><UIButton title={pending ? 'Salvando...' : 'Salvar contrato'} onPress={() => onSubmit({ proposalId, monthlyValue, saleDate, startDate, endDate, installmentDueDay: dueDayNumber, notes: notes.trim() || null })} disabled={pending || !canSubmit} style={styles.action} /></View></UICard></ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: 80 }, card: { gap: spacing.md }, title: { fontSize: 20, fontFamily: 'Inter_700Bold' }, label: { fontSize: 12, fontFamily: 'Inter_600SemiBold' }, hint: { fontSize: 12 }, chips: { gap: spacing.sm }, actions: { flexDirection: 'row', gap: spacing.sm }, action: { flex: 1 } });
