import React, { useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall } from '@/src/api/client';
import type { Station } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { leadMetricsSchema } from '@/src/api/schemas';
import { UIBadge, UIBottomSheet, UIButton, UICard, UIChip, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { spacing } from '@/src/theme';

type CatalogKind = 'programs' | 'products' | 'proposal-types' | 'lead-sources';
type CatalogItem = {
  id: string;
  name?: string | null;
  title?: string | null;
  active: boolean;
  stationId?: string | null;
  slug?: string;
  order?: number;
  suggestedValueMin?: string | null;
};

const CONFIG: Record<CatalogKind, { title: string; endpoint: string; needsStation: boolean }> = {
  programs: { title: 'Programas', endpoint: '/proposal-categories', needsStation: true },
  products: { title: 'Produtos', endpoint: '/product-templates', needsStation: true },
  'proposal-types': { title: 'Tipos de Proposta', endpoint: '/proposal-types', needsStation: false },
  'lead-sources': { title: 'Origens de Leads', endpoint: '/lead-sources', needsStation: false },
};

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function CatalogListScreen({ kind }: { kind: CatalogKind }) {
  const config = CONFIG[kind];
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CatalogItem | null | undefined>(undefined);
  const [name, setName] = useState('');
  const [stationId, setStationId] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [order, setOrder] = useState(0);
  const queryKey = ['admin-catalog', kind, search];
  const query = useQuery({
    queryKey,
    queryFn: () => apiCall<CatalogItem[]>('GET', `${config.endpoint}?active=all${search.trim() ? `&search=${encodeURIComponent(search.trim())}` : ''}`),
  });
  const stationQuery = useQuery({
    queryKey: ['stations', 'catalog-form'],
    queryFn: () => apiCall<Station[]>('GET', '/stations'),
    enabled: config.needsStation,
  });
  const metricsQuery = useQuery({
    queryKey: ['lead-metrics'],
    queryFn: async () => leadMetricsSchema.parse(await apiCall<unknown>('GET', '/lead-metrics')),
    enabled: kind === 'lead-sources',
  });
  const saveMutation = useMutation({
    mutationFn: () => {
      const activeOnCreate = editing ? {} : { active: true };
      const base = kind === 'products'
        ? { title: name.trim(), name: name.trim(), stationId, suggestedValueMin: suggestedValue || null, ...activeOnCreate }
        : kind === 'programs'
          ? { name: name.trim(), slug: slugify(name), stationId, ...activeOnCreate }
          : kind === 'lead-sources'
            ? { name: name.trim(), slug: slugify(name), order, ...activeOnCreate }
            : { name: name.trim(), ...activeOnCreate };
      return apiCall(editing ? 'PATCH' : 'POST', editing ? `${config.endpoint}/${editing.id}` : config.endpoint, base);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog', kind] });
      setEditing(undefined);
      showToast(editing ? 'Cadastro atualizado.' : 'Cadastro criado.', 'success');
    },
    onError: () => showToast('Nao foi possivel salvar.', 'error'),
  });
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiCall('DELETE', `${config.endpoint}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-catalog', kind] });
      showToast('Cadastro desativado.', 'success');
    },
  });
  const rows = useMemo(() => query.data ?? [], [query.data]);
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  function openForm(item: CatalogItem | null) {
    setEditing(item);
    setName(item?.title || item?.name || '');
    setStationId(item?.stationId || stationQuery.data?.[0]?.id || '');
    setSuggestedValue(item?.suggestedValueMin ?? '');
    setOrder(item?.order ?? 0);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + spacing.md, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <UIButton variant="ghost" iconLeft="arrow-left" size="sm" onPress={() => router.back()} accessibilityLabel="Voltar" />
        <UIHeader
          title={config.title}
          subtitle="Gerencie itens do catálogo comercial."
          style={styles.headerCopy}
          action={<UIButton iconLeft="plus" size="sm" title="Novo" onPress={() => openForm(null)} />}
        />
      </View>
      <View style={styles.searchWrap}>
        <UIInput leftIcon="search" placeholder="Buscar" value={search} onChangeText={setSearch} />
      </View>
      {kind === 'lead-sources' && metricsQuery.data && (
        <View style={styles.metrics}>
          {[
            ['Captados', metricsQuery.data.totals.captured],
            ['Em aberto', metricsQuery.data.totals.open],
            ['Convertidos', metricsQuery.data.totals.converted],
            ['Conversao', `${metricsQuery.data.totals.conversionRate}%`],
          ].map(([label, value]) => (
            <UICard key={String(label)} variant="elevated" style={styles.metric}>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </UICard>
          ))}
        </View>
      )}
      {query.isLoading ? <LoadingSpinner message="Carregando..." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />} contentContainerStyle={styles.list}>
          {!rows.length && <UIEmptyState icon="inbox" title="Nenhum cadastro encontrado" />}
          {rows.map((item) => (
            <UICard key={item.id} variant="elevated" style={styles.row} onPress={() => openForm(item)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title || item.name}</Text>
                <UIBadge label={item.active ? 'Ativo' : 'Inativo'} color={item.active ? colors.success : colors.mutedForeground} size="sm" />
              </View>
              {item.active && (
                <UIButton
                  accessibilityLabel={`Desativar ${item.title || item.name}`}
                  variant="ghost"
                  iconLeft="trash-2"
                  size="sm"
                  onPress={(event) => {
                    event.stopPropagation();
                    showConfirm({ title: 'Desativar cadastro?', message: 'O historico sera preservado.', confirmText: 'Desativar', destructive: true, onConfirm: () => deactivateMutation.mutate(item.id) });
                  }}
                />
              )}
            </UICard>
          ))}
        </ScrollView>
      )}
      <UIBottomSheet visible={editing !== undefined} onClose={() => setEditing(undefined)}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{editing ? 'Editar' : 'Novo cadastro'}</Text>
            <UIInput value={name} onChangeText={setName} placeholder={kind === 'products' ? 'Nome do produto' : 'Nome'} />
            {config.needsStation && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Empresa</Text>
                <ScrollView horizontal contentContainerStyle={styles.stationList}>
                  {(stationQuery.data ?? []).filter((station) => station.active).map((station) => (
                    <UIChip key={station.id} label={station.name} active={stationId === station.id} onPress={() => setStationId(station.id)} />
                  ))}
                </ScrollView>
              </>
            )}
            {kind === 'products' && <UIInput value={suggestedValue} onChangeText={setSuggestedValue} keyboardType="decimal-pad" placeholder="Valor sugerido minimo" />}
            <UIButton
              title="Salvar"
              disabled={!name.trim() || (config.needsStation && !stationId) || saveMutation.isPending}
              onPress={() => saveMutation.mutate()}
            />
      </UIBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerCopy: { flex: 1 },
  searchWrap: { padding: spacing.md },
  metrics: { paddingHorizontal: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: { width: '48%' },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 40 },
  row: { minHeight: 68, flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  stationList: { gap: spacing.sm },
});
