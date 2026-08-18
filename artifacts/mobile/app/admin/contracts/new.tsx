import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContractForm } from '@/src/features/contracts/ContractForm';
import { createContract, listEligibleProposals } from '@/src/features/contracts/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';
import { ApiError } from '@/src/api/client';
import { useColors } from '@/hooks/useColors';
import { UIButton, UIHeader } from '@/src/ui';
import { spacing } from '@/src/theme';

export default function NewContractScreen() { const colors = useColors(); const insets = useSafeAreaInsets(); const { showToast } = useToast(); const queryClient = useQueryClient(); const eligible = useQuery({ queryKey: ['contracts', 'eligible'], queryFn: listEligibleProposals }); const mutation = useMutation({ mutationFn: createContract, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contracts'] }); showToast('Contrato criado.', 'success'); router.replace('/admin/contracts'); }, onError: (error) => showToast(error instanceof ApiError ? error.message : 'Erro ao criar contrato.', 'error') }); const topPad = Platform.OS === 'web' ? 67 : insets.top; return <View style={[styles.container, { backgroundColor: colors.background }]}><View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border }]}><UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" /><UIHeader title="Novo contrato" subtitle="Selecione uma proposta aprovada." style={{ flex: 1 }} /></View>{eligible.isLoading ? <LoadingSpinner message="Carregando propostas elegíveis..." /> : <ContractForm eligible={eligible.data ?? []} pending={mutation.isPending} onCancel={() => router.back()} onSubmit={(value) => mutation.mutate(value)} />}</View>; }
const styles = StyleSheet.create({ container: { flex: 1 }, header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, gap: spacing.sm } });
