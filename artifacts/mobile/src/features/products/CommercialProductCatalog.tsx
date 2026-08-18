import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ProductTemplate, Station } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { UIBadge, UICard, UIChip, UIEmptyState, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

type CommercialProduct = ProductTemplate & { programName?: string | null };

export function CommercialProductCatalog({ stations, products, loading, error, onRetry }: { stations: Station[]; products: CommercialProduct[]; loading: boolean; error: unknown; onRetry: () => void }) {
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [stationId, setStationId] = useState<string | null>(null);
  const filtered = useMemo(() => products.filter((product) => (!stationId || product.stationId === stationId) && `${product.title} ${product.programName ?? product.program ?? ''}`.toLowerCase().includes(search.toLowerCase())), [products, search, stationId]);
  const stationById = new Map(stations.map((station) => [station.id, station]));
  if (loading) return <Text style={[styles.state, { color: colors.mutedForeground }]}>Carregando produtos...</Text>;
  if (error) return <UIEmptyState icon="alert-circle" title="Erro ao carregar produtos" actionLabel="Tentar novamente" onAction={onRetry} />;
  return <ScrollView contentContainerStyle={styles.content}><Text style={[styles.heading, { color: colors.foreground }]}>Produtos da empresa</Text><UIInput leftIcon="search" placeholder="Buscar produto" value={search} onChangeText={setSearch} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><UIChip label="Todas as empresas" active={!stationId} onPress={() => setStationId(null)} />{stations.filter((station) => station.viewerCanViewCatalog !== false).map((station) => <UIChip key={station.id} label={station.name} active={stationId === station.id} onPress={() => setStationId(station.id)} />)}</ScrollView>{!filtered.length ? <UIEmptyState icon="package" title="Nenhum produto encontrado" description={stations.length ? 'Nenhum produto está disponível para os filtros atuais.' : 'Nenhuma Empresa autorizada possui catálogo.'} /> : <View style={styles.list}>{filtered.map((product) => { const station = stationById.get(product.stationId); const showProgram = station?.usesPrograms !== false; return <UICard key={product.id} variant="elevated" style={styles.card}><View style={styles.row}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.foreground }]}>{product.title}</Text><Text style={[styles.meta, { color: colors.mutedForeground }]}>{[product.durationLabel, product.suggestedValue ? `R$ ${product.suggestedValue.replace('.', ',')}` : null, showProgram ? (product.programName ?? product.program) : null].filter(Boolean).join(' · ')}</Text></View><UIBadge label={product.active === false ? 'Inativo' : 'Ativo'} color={product.active === false ? colors.mutedForeground : colors.success} size="sm" /></View></UICard>; })}</View>}</ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: spacing.lg, paddingBottom: 120, gap: spacing.md }, heading: { fontSize: 20, fontFamily: 'Inter_800ExtraBold' }, filters: { gap: spacing.sm }, list: { gap: spacing.sm }, card: { gap: spacing.sm }, row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }, title: { fontSize: 15, fontFamily: 'Inter_700Bold' }, meta: { fontSize: 12, marginTop: 4 }, state: { padding: spacing.lg } });
