import React, { useDeferredValue, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getProposalBoard, getProposalProgramBoard, moveProposal, type BoardFilters } from '../api';
import { ProposalStagePager } from './ProposalStagePager';
import { ProposalListView } from './ProposalListView';
import { ProposalProgramBoardView } from './ProposalProgramBoardView';
import { ProposalFiltersSheet } from './ProposalFiltersSheet';
import { queryKeys } from '@/src/api/queryKeys';
import type { ProposalProgramBoard, ProposalProgressBoard } from '@/src/api/contracts';
import type { ProposalStatus, ProposalTimelineStep } from '@/src/types';
import { PROPOSAL_STATUS_LABELS } from '@/src/utils/enums';
import { useColors } from '@/hooks/useColors';
import { EmptyState } from '@/components/EmptyState';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useToast } from '@/components/ToastProvider';

export function ProposalBoardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const params = useLocalSearchParams<{ status?: string }>();
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<'board' | 'programs' | 'list'>('board');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<BoardFilters>({});
  const deferredSearch = useDeferredValue(search);
  const status = advancedFilters.status ?? (isProposalStatus(params.status) ? params.status : undefined);
  const filters = useMemo(
    () => ({
      ...advancedFilters,
      search: deferredSearch.trim() || undefined,
      programId: programId || advancedFilters.programId,
      status,
    }),
    [advancedFilters, deferredSearch, programId, status],
  );
  const query = useQuery({
    queryKey: queryKeys.proposals.board(filters),
    queryFn: () => getProposalBoard(filters),
  });
  const programBoardQuery = useQuery({
    queryKey: queryKeys.proposals.programBoard(filters),
    queryFn: () => getProposalProgramBoard(filters),
    enabled: viewMode === 'programs' || filtersOpen,
  });
  const progressBoard = useMemo(() => filterProgressBoard(query.data ?? { programs: [] }, filters), [query.data, filters]);
  const programBoard = useMemo(() => filterProgramBoard(programBoardQuery.data ?? { programs: [] }, filters), [programBoardQuery.data, filters]);
  const programs = (programBoardQuery.data?.programs ?? query.data?.programs ?? []);
  const localFilterCount = [filters.dateFrom, filters.dateTo, filters.createdByName, filters.proposalTypeName, filters.stationId].filter(Boolean).length;
  const moveMutation = useMutation({
    mutationFn: ({ id, step }: { id: string; step: ProposalTimelineStep }) => moveProposal(id, step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.programBoard({}) });
      showToast('Andamento atualizado.', 'success');
    },
    onError: () => showToast('Nao foi possivel atualizar o andamento.', 'error'),
  });
  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Propostas</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Acompanhe o andamento por etapa</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Criar nova proposta"
          style={[styles.newButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/proposal/new')}
        >
          <Feather name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
      <View style={[styles.filters, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.filterTop}>
          {status && (
            <TouchableOpacity
              style={[styles.activeFilter, { borderColor: colors.primary }]}
              onPress={() => {
                setAdvancedFilters((current) => ({ ...current, status: undefined }));
                router.setParams({ status: undefined });
              }}
            >
              <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                {isProposalStatus(status) ? PROPOSAL_STATUS_LABELS[status] : status}
              </Text>
              <Feather name="x" size={15} color={colors.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: colors.border }]}
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros de propostas"
          >
            <Feather name="filter" size={15} color={localFilterCount ? colors.primary : colors.foreground} />
            {!!localFilterCount && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>{localFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={[styles.modeToggle, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            {(['board', 'programs', 'list'] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.modeOption, viewMode === mode && { backgroundColor: colors.card }]}
                onPress={() => setViewMode(mode)}
              >
                <Feather name={mode === 'board' ? 'columns' : mode === 'programs' ? 'grid' : 'list'} size={15} color={viewMode === mode ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.modeText, { color: viewMode === mode ? colors.primary : colors.mutedForeground }]}>
                  {mode === 'board' ? 'Etapas' : mode === 'programs' ? 'Programas' : 'Lista'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={[styles.search, { borderColor: colors.border, backgroundColor: colors.muted }]}>
          <Feather name="search" size={17} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Cliente, proposta ou responsavel"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.programs}>
          <TouchableOpacity
            style={[styles.chip, { borderColor: colors.border }, !programId && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setProgramId(undefined)}
          >
            <Text style={[styles.chipText, { color: !programId ? '#FFF' : colors.foreground }]}>Todos</Text>
          </TouchableOpacity>
          {programs.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={[styles.chip, { borderColor: colors.border }, programId === program.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setProgramId(program.id)}
            >
              <Text style={[styles.chipText, { color: programId === program.id ? '#FFF' : colors.foreground }]}>{program.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {query.isLoading || (viewMode === 'programs' && programBoardQuery.isLoading) ? (
        <LoadingSpinner message="Carregando propostas..." />
      ) : query.isError || (viewMode === 'programs' && programBoardQuery.isError) ? (
        <EmptyState icon="alert-circle" title="Erro ao carregar" actionLabel="Tentar novamente" onAction={() => { query.refetch(); programBoardQuery.refetch(); }} />
      ) : viewMode === 'programs' ? (
        <ProposalProgramBoardView
          board={programBoard}
          refreshing={programBoardQuery.isFetching}
          onRefresh={programBoardQuery.refetch}
        />
      ) : viewMode === 'list' ? (
        <ProposalListView
          board={progressBoard}
          refreshing={query.isFetching}
          moving={moveMutation.isPending}
          onRefresh={query.refetch}
          onMove={(id, step) => moveMutation.mutate({ id, step })}
        />
      ) : (
        <ProposalStagePager
          board={progressBoard}
          moving={moveMutation.isPending}
          refreshing={query.isFetching}
          onRefresh={query.refetch}
          onMove={(id, step) => moveMutation.mutate({ id, step })}
        />
      )}
      <ProposalFiltersSheet
        visible={filtersOpen}
        filters={filters}
        programs={programs}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => {
          setAdvancedFilters(next);
          setProgramId(next.programId);
        }}
        onClear={() => {
          setAdvancedFilters({});
          setProgramId(undefined);
          router.setParams({ status: undefined });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 2 },
  newButton: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  filters: { padding: 12, gap: 10, borderBottomWidth: 1 },
  filterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  activeFilter: { minHeight: 40, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 7 },
  activeFilterText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  filterButton: { width: 38, height: 38, borderWidth: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 10 },
  modeToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 3, marginLeft: 'auto' },
  modeOption: { minHeight: 32, borderRadius: 999, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
  modeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  search: { minHeight: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 14 },
  programs: { gap: 8 },
  chip: { minHeight: 40, borderWidth: 1, borderRadius: 99, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});

function isProposalStatus(value?: string): value is ProposalStatus {
  return value === 'DRAFT' || value === 'SENT' || value === 'APPROVED' || value === 'REJECTED' || value === 'ARCHIVED';
}

function filterProgressBoard(board: ProposalProgressBoard, filters: BoardFilters): ProposalProgressBoard {
  const programs = filters.programId
    ? board.programs.filter((program) => program.id === filters.programId)
    : board.programs;

  return {
    ...board,
    programs: programs.map((program) => ({
      ...program,
      proposals: program.proposals.filter((proposal) => matchesLocalFilters(proposal, filters)),
    })),
  };
}

function filterProgramBoard(board: ProposalProgramBoard, filters: BoardFilters): ProposalProgramBoard {
  const programs = filters.programId
    ? board.programs.filter((program) => program.id === filters.programId)
    : board.programs;

  return {
    ...board,
    programs: programs.map((program) => ({
      ...program,
      proposals: program.proposals.filter((proposal) => matchesLocalFilters(proposal, filters)),
    })),
  };
}

function matchesLocalFilters(
  proposal: { createdByName: string; proposalTypeName: string; updatedAt?: string },
  filters: BoardFilters,
) {
  const createdBy = proposal.createdByName.toLowerCase();
  const proposalType = proposal.proposalTypeName.toLowerCase();
  const updatedAt = proposal.updatedAt ? new Date(String(proposal.updatedAt)) : null;
  if (filters.createdByName && !createdBy.includes(filters.createdByName.toLowerCase())) return false;
  if (filters.proposalTypeName && !proposalType.includes(filters.proposalTypeName.toLowerCase())) return false;
  if (filters.dateFrom && updatedAt && updatedAt < new Date(filters.dateFrom)) return false;
  if (filters.dateTo && updatedAt) {
    const end = new Date(filters.dateTo);
    end.setHours(23, 59, 59, 999);
    if (updatedAt > end) return false;
  }
  return true;
}
