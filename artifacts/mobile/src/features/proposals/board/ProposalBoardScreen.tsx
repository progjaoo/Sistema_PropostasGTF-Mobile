import React, { useDeferredValue, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { UIButton, UIChip, UIHeader, UIInput } from '@/src/ui';
import { shadows, spacing, tokens } from '@/src/theme';

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
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.background }]}>
        <UIHeader
          title="Propostas"
          subtitle="Acompanhe o andamento por etapa"
          action={
            <UIButton
              accessibilityLabel="Criar nova proposta"
              iconLeft="plus"
              size="lg"
              style={styles.newButton}
              onPress={() => router.push('/proposal/new')}
            />
          }
        />
      </View>
      <View style={[styles.filters, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.filterTop}>
          {status && (
            <UIChip
              label={isProposalStatus(status) ? PROPOSAL_STATUS_LABELS[status] : status}
              active
              icon="x"
              onPress={() => {
                setAdvancedFilters((current) => ({ ...current, status: undefined }));
                router.setParams({ status: undefined });
              }}
            />
          )}
          <UIButton
            variant="outline"
            size="sm"
            iconLeft="filter"
            style={[styles.filterButton, { borderColor: colors.border }]}
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros de propostas"
          >
            {!!localFilterCount && (
              <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.filterBadgeText}>{localFilterCount}</Text>
              </View>
            )}
          </UIButton>
          <View style={[styles.modeToggle, { borderColor: colors.border, backgroundColor: colors.muted }]}>
            {(['board', 'programs', 'list'] as const).map((mode) => (
              <UIChip
                key={mode}
                label={mode === 'board' ? 'Etapas' : mode === 'programs' ? 'Programas' : 'Lista'}
                icon={mode === 'board' ? 'columns' : mode === 'programs' ? 'grid' : 'list'}
                active={viewMode === mode}
                style={styles.modeOption}
                onPress={() => setViewMode(mode)}
              />
            ))}
          </View>
        </View>
        <UIInput
          leftIcon="search"
          placeholder="Cliente, proposta ou responsável"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.programs}>
          <UIChip
            label="Todos"
            active={!programId}
            onPress={() => setProgramId(undefined)}
          />
          {programs.map((program) => (
            <UIChip
              key={program.id}
              label={program.name}
              active={programId === program.id}
              onPress={() => setProgramId(program.id)}
            />
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
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  newButton: { width: 44, paddingHorizontal: 0, borderRadius: tokens.radius.lg },
  filters: { marginHorizontal: spacing.lg, padding: spacing.md, gap: spacing.md, borderWidth: 1, borderRadius: tokens.radius.xl, ...shadows.sm },
  filterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  filterButton: { width: 38, minHeight: 38, paddingHorizontal: 0, borderRadius: 999 },
  filterBadge: { position: 'absolute', top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  filterBadgeText: { color: '#FFF', fontFamily: 'Inter_700Bold', fontSize: 10 },
  modeToggle: { flexDirection: 'row', borderWidth: 1, borderRadius: 999, padding: 3, marginLeft: 'auto' },
  modeOption: { minHeight: 32 },
  programs: { gap: 8 },
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
