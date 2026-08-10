import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiCall } from '@/src/api/client';
import type { Station } from '@/src/types';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { showConfirm } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { leadMetricsSchema } from '@/src/api/schemas';

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
      <View style={[styles.header, { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color={colors.foreground} /></TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{config.title}</Text>
        <TouchableOpacity style={[styles.add, { backgroundColor: colors.primary }]} onPress={() => openForm(null)}>
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <Feather name="search" size={17} color={colors.mutedForeground} />
        <TextInput style={[styles.input, { color: colors.foreground }]} value={search} onChangeText={setSearch} placeholder="Buscar" placeholderTextColor={colors.mutedForeground} />
      </View>
      {kind === 'lead-sources' && metricsQuery.data && (
        <View style={styles.metrics}>
          {[
            ['Captados', metricsQuery.data.totals.captured],
            ['Em aberto', metricsQuery.data.totals.open],
            ['Convertidos', metricsQuery.data.totals.converted],
            ['Conversao', `${metricsQuery.data.totals.conversionRate}%`],
          ].map(([label, value]) => (
            <View key={String(label)} style={[styles.metric, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{value}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>
      )}
      {query.isLoading ? <LoadingSpinner message="Carregando..." /> : (
        <ScrollView refreshControl={<RefreshControl refreshing={query.isFetching} onRefresh={query.refetch} />} contentContainerStyle={styles.list}>
          {!rows.length && <EmptyState icon="inbox" title="Nenhum cadastro encontrado" />}
          {rows.map((item) => (
            <TouchableOpacity key={item.id} style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => openForm(item)}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>{item.title || item.name}</Text>
                <Text style={[styles.rowMeta, { color: item.active ? colors.success : colors.mutedForeground }]}>{item.active ? 'Ativo' : 'Inativo'}</Text>
              </View>
              {item.active && (
                <TouchableOpacity
                  accessibilityLabel={`Desativar ${item.title || item.name}`}
                  style={styles.delete}
                  onPress={(event) => {
                    event.stopPropagation();
                    showConfirm({ title: 'Desativar cadastro?', message: 'O historico sera preservado.', confirmText: 'Desativar', destructive: true, onConfirm: () => deactivateMutation.mutate(item.id) });
                  }}
                >
                  <Feather name="trash-2" size={18} color={colors.destructive} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      <Modal transparent visible={editing !== undefined} animationType="slide" onRequestClose={() => setEditing(undefined)}>
        <Pressable style={styles.backdrop} onPress={() => setEditing(undefined)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(event) => event.stopPropagation()}>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{editing ? 'Editar' : 'Novo cadastro'}</Text>
            <TextInput style={[styles.formInput, { color: colors.foreground, borderColor: colors.border }]} value={name} onChangeText={setName} placeholder={kind === 'products' ? 'Nome do produto' : 'Nome'} placeholderTextColor={colors.mutedForeground} />
            {config.needsStation && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Empresa</Text>
                <ScrollView horizontal contentContainerStyle={styles.stationList}>
                  {(stationQuery.data ?? []).filter((station) => station.active).map((station) => (
                    <TouchableOpacity key={station.id} style={[styles.station, { borderColor: stationId === station.id ? colors.primary : colors.border }]} onPress={() => setStationId(station.id)}>
                      <Text style={{ color: colors.foreground }}>{station.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}
            {kind === 'products' && <TextInput style={[styles.formInput, { color: colors.foreground, borderColor: colors.border }]} value={suggestedValue} onChangeText={setSuggestedValue} keyboardType="decimal-pad" placeholder="Valor sugerido minimo" placeholderTextColor={colors.mutedForeground} />}
            <TouchableOpacity disabled={!name.trim() || (config.needsStation && !stationId) || saveMutation.isPending} style={[styles.save, { backgroundColor: colors.primary, opacity: !name.trim() ? 0.5 : 1 }]} onPress={() => saveMutation.mutate()}>
              <Text style={styles.saveText}>Salvar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 20 },
  add: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  search: { margin: 12, minHeight: 46, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontFamily: 'Inter_400Regular' },
  metrics: { paddingHorizontal: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '48%', borderWidth: 1, borderRadius: 10, padding: 12 },
  metricValue: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  metricLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  list: { padding: 12, gap: 10, paddingBottom: 40 },
  row: { borderWidth: 1, borderRadius: 12, minHeight: 68, padding: 14, flexDirection: 'row', alignItems: 'center' },
  rowTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  rowMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  delete: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.45)' },
  sheet: { padding: 20, paddingBottom: 36, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 12 },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  formInput: { minHeight: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontFamily: 'Inter_400Regular' },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  stationList: { gap: 8 },
  station: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  save: { minHeight: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFF', fontFamily: 'Inter_600SemiBold' },
});
