import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/src/api/client';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { UIButton, UIHeader } from '@/src/ui';
import { useColors } from '@/hooks/useColors';
import { ContractForm } from '@/src/features/contracts/ContractForm';
import { cancelContract, listContracts, updateContract } from '@/src/features/contracts/api';
import { spacing } from '@/src/theme';

export default function CommercialContractDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>(); const colors = useColors(); const insets = useSafeAreaInsets(); const { showToast } = useToast(); const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['contracts', 'detail', id], queryFn: async () => (await listContracts()).find((item) => item.id === id), enabled: !!id });
  const mutation = useMutation({ mutationFn: (value: Parameters<typeof updateContract>[1]) => updateContract(id!, value), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); showToast('Contrato atualizado.', 'success'); }, onError: (error) => showToast(error instanceof ApiError ? error.message : 'Erro ao atualizar contrato.', 'error') });
  const cancel = useMutation({ mutationFn: () => cancelContract(id!), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); showToast('Contrato cancelado.', 'success'); router.back(); }, onError: (error) => showToast(error instanceof ApiError ? error.message : 'Erro ao cancelar contrato.', 'error') });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.container, { backgroundColor: colors.background }]}><View style={[styles.header, { paddingTop: topPad + spacing.md, borderBottomColor: colors.border }]}><UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" /><UIHeader title="Contrato" subtitle="Edite valores e vigência." style={{ flex: 1 }} /></View>{query.data ? <ContractForm contract={query.data} eligible={[]} pending={mutation.isPending} onCancel={() => router.back()} onSubmit={(value) => mutation.mutate({ monthlyValue: value.monthlyValue, saleDate: value.saleDate, startDate: value.startDate, endDate: value.endDate, installmentDueDay: value.installmentDueDay, notes: value.notes })} /> : null}{query.data?.status === 'ACTIVE' && <UIButton variant="destructive" title={cancel.isPending ? 'Cancelando...' : 'Cancelar contrato'} onPress={() => showConfirm({ title: 'Cancelar contrato?', message: 'O histórico será preservado e as receitas futuras serão recalculadas.', confirmText: 'Cancelar contrato', destructive: true, onConfirm: () => cancel.mutate() })} disabled={cancel.isPending} style={styles.cancel} />}</View>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 }, cancel: { margin: spacing.lg } });
