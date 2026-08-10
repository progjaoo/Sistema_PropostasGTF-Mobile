import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet,
  Platform, ActivityIndicator, FlatList, Pressable,
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
import { UIBadge, UIButton, UICard, UIChip, UIEmptyState, UIHeader, UIInput } from '@/src/ui';
import { shadows, spacing, tokens } from '@/src/theme';

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
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <Pressable onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Fechar nova proposta">
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>
        <UIHeader title="Nova Proposta" subtitle="Escolha empresa, cliente e tipo para iniciar o rascunho." style={styles.headerCopy} />
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando..." />
      ) : hasLoadingError ? (
        <UIEmptyState
          icon="alert-circle"
          title="Erro ao carregar dados"
          description="Não foi possível carregar empresas ou tipos de proposta."
          actionLabel="Tentar novamente"
          onAction={() => { refetchStations(); refetchTypes(); refetchAdvertisers(); }}
        />
      ) : (
        <FlatList
          data={visibleAdvertisers}
          keyExtractor={(advertiser) => advertiser.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 120 }]}
          ListHeaderComponent={
            <>
              {/* Station */}
              <UICard variant="elevated" style={styles.section}>
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
                      <UICard
                        key={station.id}
                        variant={selectedStation?.id === station.id ? 'muted' : 'default'}
                        style={[
                          styles.option,
                          selectedStation?.id === station.id && { borderColor: colors.primary },
                        ]}
                        onPress={() => setSelectedStation(station)}
                        accessibilityRole="button"
                        accessibilityLabel={`Selecionar empresa ${station.name}`}
                        accessibilityState={{ selected: selectedStation?.id === station.id }}
                      >
                        <View style={[styles.stationDot, { backgroundColor: station.primaryColor ?? colors.primary }]} />
                        <Text style={[styles.optionText, { color: colors.foreground }]}>{station.name}</Text>
                        {selectedStation?.id === station.id && (
                          <Feather name="check-circle" size={18} color={colors.primary} />
                        )}
                      </UICard>
                    ))
                  )}
                </View>
              </UICard>

              <UICard variant="elevated" style={styles.section}>
                <View style={styles.sectionHeading}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                      Cliente ou Lead <Text style={{ color: colors.destructive }}>*</Text>
                    </Text>
                    <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
                      Vincule a proposta a um cadastro real.
                    </Text>
                  </View>
                  <UIButton
                    variant="outline"
                    size="sm"
                    iconLeft="user-plus"
                    title="Novo Lead"
                    onPress={() => router.push('/advertiser/new?status=LEAD&selectOnReturn=true')}
                  />
                </View>
                <UIInput
                  leftIcon="search"
                  placeholder="Buscar cliente ou lead"
                  value={advertiserSearch}
                  onChangeText={setAdvertiserSearch}
                />
              </UICard>
            </>
          }
          renderItem={({ item: advertiser }) => (
              <UICard
                variant={selectedAdvertiser?.id === advertiser.id ? 'muted' : 'default'}
                style={[
                  styles.option,
                  selectedAdvertiser?.id === advertiser.id && { borderColor: colors.primary },
                ]}
                onPress={() => setSelectedAdvertiser(advertiser)}
              >
                <Feather name={advertiser.status === 'LEAD' ? 'user-plus' : 'users'} size={16} color={colors.mutedForeground} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionText, { color: colors.foreground }]}>{advertiser.tradeName}</Text>
                  <UIBadge label={advertiser.status === 'LEAD' ? 'Lead' : 'Cliente'} variant={advertiser.status === 'LEAD' ? 'lead' : 'client'} size="sm" />
                </View>
                {selectedAdvertiser?.id === advertiser.id && <Feather name="check-circle" size={18} color={colors.primary} />}
              </UICard>
          )}
          ListEmptyComponent={
            <Text style={[styles.noOptions, { color: colors.mutedForeground }]}>
              Nenhum cliente ou lead encontrado.
            </Text>
          }
          ListFooterComponent={
            <>
              {/* Type */}
              <UICard variant="elevated" style={[styles.section, { marginTop: 24 }]}>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
                  Tipo de Proposta <Text style={{ color: colors.destructive }}>*</Text>
                </Text>
                <View style={styles.optionList}>
                  {(proposalTypes ?? []).map((type) => (
                    <UICard
                      key={type.id}
                      variant={selectedType?.id === type.id ? 'muted' : 'default'}
                      style={[
                        styles.option,
                        selectedType?.id === type.id && { borderColor: colors.primary },
                      ]}
                      onPress={() => setSelectedType(type)}
                      accessibilityRole="button"
                      accessibilityLabel={`Selecionar tipo de proposta ${type.name}`}
                      accessibilityState={{ selected: selectedType?.id === type.id }}
                    >
                      <Feather name="tag" size={16} color={selectedType?.id === type.id ? colors.primary : colors.mutedForeground} />
                      <Text style={[styles.optionText, { color: colors.foreground }]}>{type.name}</Text>
                      {selectedType?.id === type.id && (
                        <Feather name="check-circle" size={18} color={colors.primary} />
                      )}
                    </UICard>
                  ))}
                  {(proposalTypes ?? []).length === 0 && (
                    <Text style={[styles.noOptions, { color: colors.mutedForeground }]}>
                      Nenhum tipo de proposta ativo disponível.
                    </Text>
                  )}
                </View>
              </UICard>

              {/* Period info */}
              <UICard variant="muted" style={[styles.periodInfo, { marginTop: 24 }]}>
                <Feather name="calendar" size={16} color={colors.mutedForeground} />
                <Text style={[styles.periodText, { color: colors.mutedForeground }]}>
                  Periodicidade inicial: mensal
                </Text>
              </UICard>

              <UIButton
                size="lg"
                variant={canCreate ? 'primary' : 'secondary'}
                style={styles.createBtn}
                onPress={() => canCreate && createMutation.mutate()}
                disabled={!canCreate || createMutation.isPending}
                accessibilityRole="button"
                accessibilityLabel="Criar rascunho de proposta"
                accessibilityState={{ disabled: !canCreate || createMutation.isPending, busy: createMutation.isPending }}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Feather name="file-plus" size={18} color={canCreate ? colors.primaryForeground : colors.mutedForeground} />
                    <Text style={[styles.createBtnText, { color: canCreate ? colors.primaryForeground : colors.mutedForeground }]}>
                      Criar rascunho
                    </Text>
                  </>
                )}
              </UIButton>
            </>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, gap: 12 },
  headerCopy: { flex: 1 },
  content: { padding: 20, gap: 14 },
  section: { gap: 10 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionLabel: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  sectionHint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  optionList: { gap: 8 },
  option: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, gap: 10 },
  stationDot: { width: 12, height: 12, borderRadius: 6 },
  optionText: { flex: 1, fontSize: 15, fontFamily: 'Inter_500Medium' },
  optionMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  noOptions: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', padding: 20 },
  periodInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  createBtn: { marginTop: 24 },
  createBtnText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
