import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, ActivityIndicator, ScrollView, FlatList, TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/components/ToastProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { apiCall, ApiError } from '@/src/api/client';
import { Station, ProposalType, Proposal, Advertiser } from '@/src/types';
import { useColors } from '@/hooks/useColors';

export default function NewProposalScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ selectedAdvertiserId?: string }>();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedType, setSelectedType] = useState<ProposalType | null>(null);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<Advertiser | null>(null);
  const [advertiserSearch, setAdvertiserSearch] = useState('');

  const { data: stations, isLoading: stationsLoading, isError: stationsError, refetch: refetchStations } = useQuery({
    queryKey: ['stations-for-new'],
    queryFn: () => apiCall<Station[]>('GET', '/stations'),
    staleTime: 60000,
    select: (data) => data.filter((s) => s.viewerCanCreateProposals !== false && s.active),
  });

  const { data: proposalTypes, isLoading: typesLoading, isError: typesError, refetch: refetchTypes } = useQuery({
    queryKey: ['proposal-types'],
    queryFn: () => apiCall<ProposalType[]>('GET', '/proposal-types?active=true'),
    staleTime: 60000,
    select: (data) => data.filter((t) => t.active),
  });
  const { data: advertisers, isLoading: advertisersLoading, isError: advertisersError, refetch: refetchAdvertisers } = useQuery({
    queryKey: ['advertisers', 'proposal-context'],
    queryFn: () => apiCall<Advertiser[]>('GET', '/advertisers?active=true'),
    staleTime: 30000,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiCall<Proposal>('POST', '/proposals', {
        stationId: selectedStation?.id,
        proposalTypeId: selectedType?.id,
        advertiserId: selectedAdvertiser?.id,
        periodicity: 'MONTHLY',
        showPeriod: true,
      }),
    onSuccess: async (data) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['proposals'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['program-board'] }),
      ]);
      showToast('Proposta criada como rascunho!', 'success');
      router.replace(`/proposal/${data.id}`);
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Erro ao criar proposta.';
      showToast(msg, 'error');
    },
  });

  const isLoading = stationsLoading || typesLoading || advertisersLoading;
  const hasLoadingError = stationsError || typesError || advertisersError;
  const canCreate = selectedStation !== null && selectedType !== null && selectedAdvertiser !== null;
  const visibleAdvertisers = useMemo(() => {
    const term = advertiserSearch.trim().toLowerCase();
    if (!term) return advertisers ?? [];
    return (advertisers ?? []).filter((advertiser) =>
      [advertiser.tradeName, advertiser.contactName, advertiser.contactPhone, advertiser.contactEmail]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [advertiserSearch, advertisers]);

  React.useEffect(() => {
    if (!params.selectedAdvertiserId || selectedAdvertiser?.id === params.selectedAdvertiserId) return;
    const match = (advertisers ?? []).find((advertiser) => advertiser.id === params.selectedAdvertiserId);
    if (match) setSelectedAdvertiser(match);
  }, [advertisers, params.selectedAdvertiserId, selectedAdvertiser?.id]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Nova Proposta</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando..." />
      ) : hasLoadingError ? (
        <View style={styles.centerState}>
          <Feather name="alert-circle" size={34} color={colors.destructive} />
          <Text style={[styles.centerTitle, { color: colors.foreground }]}>Erro ao carregar dados</Text>
          <Text style={[styles.centerText, { color: colors.mutedForeground }]}>
            Não foi possível carregar empresas ou tipos de proposta.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => { refetchStations(); refetchTypes(); refetchAdvertisers(); }}
            accessibilityRole="button"
            accessibilityLabel="Tentar carregar novamente"
          >
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={visibleAdvertisers}
          keyExtractor={(advertiser) => advertiser.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
          ListHeaderComponent={
            <>
              {/* Station */}
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                  Empresa <Text style={{ color: colors.destructive }}>*</Text>
                </Text>
                <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                  Selecione a empresa para esta proposta.
                </Text>
                <View style={styles.optionList}>
                  {(stations ?? []).length === 0 ? (
                    <Text style={[styles.noOptions, { color: colors.mutedForeground }]}>
                      Nenhuma empresa disponível para criação de propostas.
                    </Text>
                  ) : (
                    (stations ?? []).map((station) => (
                      <TouchableOpacity
                        key={station.id}
                        style={[
                          styles.option,
                          { borderColor: colors.border, backgroundColor: colors.card },
                          selectedStation?.id === station.id && { borderColor: colors.primary, backgroundColor: colors.accent },
                        ]}
                        onPress={() => setSelectedStation(station)}
                        activeOpacity={0.7}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar empresa ${station.name}`}
                        accessibilityState={{ selected: selectedStation?.id === station.id }}
                      >
                        <View style={[styles.stationDot, { backgroundColor: station.primaryColor ?? colors.primary }]} />
                        <Text style={[styles.optionText, { color: colors.foreground }]}>{station.name}</Text>
                        {selectedStation?.id === station.id && (
                          <Feather name="check-circle" size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeading}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                      Cliente ou Lead <Text style={{ color: colors.destructive }}>*</Text>
                    </Text>
                    <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                      Vincule a proposta a um cadastro real.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.inlineButton, { borderColor: colors.primary }]}
                onPress={() => router.push('/advertiser/new?status=LEAD&selectOnReturn=true')}
                  >
                    <Feather name="user-plus" size={16} color={colors.primary} />
                    <Text style={[styles.inlineButtonText, { color: colors.primary }]}>Novo Lead</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Feather name="search" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.searchInput, { color: colors.foreground }]}
                    placeholder="Buscar cliente ou lead"
                    placeholderTextColor={colors.mutedForeground}
                    value={advertiserSearch}
                    onChangeText={setAdvertiserSearch}
                  />
                </View>
              </View>
            </>
          }
          renderItem={({ item: advertiser }) => (
              <TouchableOpacity
                style={[
                  styles.option,
                  { borderColor: colors.border, backgroundColor: colors.card },
                  selectedAdvertiser?.id === advertiser.id && { borderColor: colors.primary, backgroundColor: colors.accent },
                ]}
                onPress={() => setSelectedAdvertiser(advertiser)}
              >
                <Feather name={advertiser.status === 'LEAD' ? 'user-plus' : 'users'} size={16} color={colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{advertiser.tradeName}</Text>
                  <Text style={[styles.optionMeta, { color: colors.mutedForeground }]}>{advertiser.status === 'LEAD' ? 'Lead' : 'Cliente'}</Text>
                </View>
                {selectedAdvertiser?.id === advertiser.id && <Feather name="check-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[styles.noOptions, { color: colors.mutedForeground }]}>
              Nenhum cliente ou lead encontrado.
            </Text>
          }
          ListFooterComponent={
            <>
              {/* Type */}
              <View style={[styles.section, { marginTop: 24 }]}>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                  Tipo de Proposta <Text style={{ color: colors.destructive }}>*</Text>
                </Text>
                <View style={styles.optionList}>
                  {(proposalTypes ?? []).map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.option,
                        { borderColor: colors.border, backgroundColor: colors.card },
                        selectedType?.id === type.id && { borderColor: colors.primary, backgroundColor: colors.accent },
                      ]}
                      onPress={() => setSelectedType(type)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar tipo de proposta ${type.name}`}
                      accessibilityState={{ selected: selectedType?.id === type.id }}
                    >
                      <Feather name="tag" size={16} color={selectedType?.id === type.id ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.optionText, { color: colors.foreground }]}>{type.name}</Text>
                      {selectedType?.id === type.id && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                  {(proposalTypes ?? []).length === 0 && (
                    <Text style={[styles.noOptions, { color: colors.mutedForeground }]}>
                      Nenhum tipo de proposta ativo disponível.
                    </Text>
                  )}
                </View>
              </View>

              {/* Period info */}
              <View style={[styles.periodInfo, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 24 }]}>
                <Feather name="calendar" size={16} color={colors.mutedForeground} />
                <Text style={[styles.periodText, { color: colors.mutedForeground }]}>
                  Periodicidade inicial: mensal
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.createBtn,
                  { backgroundColor: canCreate ? colors.primary : colors.muted, marginTop: 24 },
                ]}
                onPress={() => canCreate && createMutation.mutate()}
                disabled={!canCreate || createMutation.isPending}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Criar rascunho de proposta"
                accessibilityState={{ disabled: !canCreate || createMutation.isPending, busy: createMutation.isPending }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Feather name="file-plus" size={18} color={canCreate ? '#FFF' : colors.mutedForeground} />
                    <Text style={[styles.createBtnText, { color: canCreate ? '#FFF' : colors.mutedForeground }]}>
                      Criar rascunho
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold' },
  content: { padding: 20, gap: 24 },
  section: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sectionHint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  optionList: { gap: 8 },
  advertiserList: { maxHeight: 340 },
  searchBox: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
  option: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1.5, gap: 10 },
  stationDot: { width: 12, height: 12, borderRadius: 6 },
  optionText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  optionMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  inlineButton: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  inlineButtonText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  noOptions: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 20 },
  periodInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, borderWidth: 1 },
  periodText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
  createBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  centerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  centerText: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});
