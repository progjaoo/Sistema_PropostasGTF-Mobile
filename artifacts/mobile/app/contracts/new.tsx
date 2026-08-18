import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiError } from '@/src/api/client';
import { useToast } from '@/components/ToastProvider';
import { UIButton, UIHeader } from '@/src/ui';
import { useColors } from '@/hooks/useColors';
import { ContractForm } from '@/src/features/contracts/ContractForm';
import { createContract, listEligibleProposals } from '@/src/features/contracts/api';
import { spacing } from '@/src/theme';

export default function CommercialNewContractRoute() {
  const colors = useColors(); const insets = useSafeAreaInsets(); const { showToast } = useToast(); const queryClient = useQueryClient();
  const eligible = useQuery({ queryKey: ['contracts', 'eligible'], queryFn: listEligibleProposals });
  const mutation = useMutation({ mutationFn: createContract, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); showToast('Contrato criado.', 'success'); router.replace('/(comercial)/contracts' as any); }, onError: (error) => showToast(error instanceof ApiError ? error.message : 'Erro ao criar contrato.', 'error') });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  return <View style={[styles.container, { backgroundColor: colors.background }]}><View style={[styles.header, { paddingTop: topPad + spacing.md, borderBottomColor: colors.border }]}><UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" /><UIHeader title="Novo contrato" subtitle="Use uma proposta aprovada da sua carteira." style={{ flex: 1 }} /></View><ContractForm eligible={eligible.data ?? []} pending={mutation.isPending} onCancel={() => router.back()} onSubmit={(value) => mutation.mutate(value)} /></View>;
}
const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1 } });
