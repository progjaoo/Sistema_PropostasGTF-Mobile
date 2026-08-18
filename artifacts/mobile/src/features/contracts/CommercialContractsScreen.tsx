import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { CommercialContract, CommercialContractForecastResponse, CommercialContractSummary } from '@/src/api/contracts';
import { useColors } from '@/hooks/useColors';
import { UIButton, UIEmptyState, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';
import { ContractList } from './ContractList';
import { ContractSummary } from './ContractSummary';
import { RevenueForecast } from './RevenueForecast';

export function CommercialContractsScreen({ contracts, summary, forecast, loading = false, error = null, onRetry, onSelect, onCreate }: { contracts: CommercialContract[]; summary: CommercialContractSummary; forecast: CommercialContractForecastResponse; loading?: boolean; error?: unknown; onRetry?: () => void; onSelect: (contract: CommercialContract) => void; onCreate: () => void }) {
  const colors = useColors();
  const [search, setSearch] = React.useState('');
  const filtered = contracts.filter((contract) => `${contract.advertiserName ?? ''} ${contract.proposalName ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <Text style={[styles.state, { color: colors.mutedForeground }]}>Carregando contratos...</Text>;
  if (error) return <UIEmptyState icon="alert-circle" title="Erro ao carregar contratos" actionLabel="Tentar novamente" onAction={onRetry} />;
  return <ScrollView contentContainerStyle={styles.content}><View style={styles.titleRow}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.foreground }]}>Meus Contratos</Text><Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Somente contratos da sua carteira.</Text></View><UIButton title="Novo" iconLeft="plus" size="sm" onPress={onCreate} /></View><ContractSummary summary={summary} /><RevenueForecast forecast={forecast} /><UIInput leftIcon="search" placeholder="Buscar cliente ou proposta" value={search} onChangeText={setSearch} />{filtered.length ? <ContractList contracts={filtered} onSelect={onSelect} /> : <UIEmptyState icon="file-text" title="Nenhum contrato encontrado" />}</ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md }, state: { padding: spacing.lg }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm }, title: { fontSize: 21, fontFamily: 'Inter_800ExtraBold' }, subtitle: { fontSize: 12, marginTop: 3 } });
