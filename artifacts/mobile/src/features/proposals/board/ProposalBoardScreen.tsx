import React, { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ProgressBoardProposal } from '@/src/api/contracts';
import type { ProposalStatus, ProposalTimelineStep, UserRole } from '@/src/types';
import { useAuthStore } from '@/src/store/authStore';
import { queryKeys } from '@/src/api/queryKeys';
import { useColors } from '@/hooks/useColors';
import { useToast } from '@/components/ToastProvider';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getNewProposalActionStyle } from './proposalBoardUi';
import { moveProposal, type BoardFilters } from '../api';
import {
  buildProposalStageColumns,
  buildProposalSearchResults,
  countActiveProposalFilters,
  filterProposalBoardLocally,
  type BoardDensityMode,
  type BoardGroupingMode,
  type ProposalBoardSelection,
} from './proposalBoardModel';
import { useContextualProposalBoard } from './useContextualProposalBoard';
import { BoardContextToolbar } from './BoardContextToolbar';
import { ProposalContextSheet, type ProposalContextOption } from './ProposalContextSheet';
import { ProposalSearchOverlay } from './ProposalSearchOverlay';
import { ProposalFiltersSheet } from './ProposalFiltersSheet';
import { ActiveProposalFilters } from './ActiveProposalFilters';
import { ContextualProposalKanban } from './ContextualProposalKanban';
import { MoveProposalSheet } from './MoveProposalSheet';
import { UIButton, UIEmptyState, UIHeader } from '@/src/ui';
import { spacing } from '@/src/theme';

export function ProposalBoardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuthStore();
  const role: UserRole = user?.role ?? 'COMERCIAL';
  const params = useLocalSearchParams<{ status?: string }>();
  const routeStatus = isProposalStatus(params.status) ? params.status : undefined;
  const [grouping, setGrouping] = useState<BoardGroupingMode>('station');
  const [density, setDensity] = useState<BoardDensityMode>('focused');
  const [selection, setSelection] = useState<ProposalBoardSelection>({});
  const [search, setSearch] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<BoardFilters>({});
  const [contextOpen, setContextOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<ProgressBoardProposal | null>(null);
  const deferredSearch = useDeferredValue(search.trim());

  const serverFilters = useMemo<BoardFilters>(() => ({
    status: advancedFilters.status ?? routeStatus,
  }), [advancedFilters.status, routeStatus]);

  const { stationsQuery, programsQuery, boardQuery, board } = useContextualProposalBoard({
    grouping,
    selection,
    filters: serverFilters,
  });
  const stations = stationsQuery.data ?? [];
  const programs = programsQuery.data?.programs ?? [];

  useEffect(() => {
    if (!stations.length) return;
    if (!selection.stationId || !stations.some((station) => station.id === selection.stationId)) {
      setSelection((current) => ({ ...current, stationId: stations[0].id }));
    }
  }, [selection.stationId, stations]);

  useEffect(() => {
    if (grouping !== 'program' || !programs.length) return;
    if (!selection.programId || !programs.some((program) => program.id === selection.programId)) {
      setSelection((current) => ({ ...current, programId: programs[0].id }));
    }
  }, [grouping, programs, selection.programId]);

  const selectedId = grouping === 'station' ? selection.stationId : selection.programId;
  const selectedProgram = programs.find((program) => program.id === selection.programId);
  const selectedStationId = grouping === 'station' ? selection.stationId : selectedProgram?.stationId;
  const selectedStation = stations.find((station) => station.id === selectedStationId);
  const contextLabel = grouping === 'station'
    ? stations.find((station) => station.id === selection.stationId)?.name ?? 'Selecionar Empresa'
    : selectedProgram?.name ?? 'Selecionar Programa';
  const contextOptions = useMemo<ProposalContextOption[]>(() => {
    if (grouping === 'station') {
      return stations.map((station) => ({
        id: station.id,
        name: station.name,
        color: station.primaryColor,
        usesPrograms: station.usesPrograms,
      }));
    }
    return programs.map((program) => ({ id: program.id, name: program.name, color: selectedStation?.primaryColor }));
  }, [grouping, programs, selectedStation?.primaryColor, stations]);
  const locallyFilteredBoard = useMemo(
    () => filterProposalBoardLocally(board, { ...advancedFilters, search: deferredSearch || undefined }),
    [advancedFilters, board, deferredSearch],
  );
  const columns = useMemo(
    () => buildProposalStageColumns(locallyFilteredBoard, grouping, selectedId),
    [grouping, locallyFilteredBoard, selectedId],
  );
  const resultCount = columns.reduce((total, column) => total + column.proposals.length, 0);
  const searchResults = useMemo(
    () => buildProposalSearchResults(locallyFilteredBoard, grouping, selectedId, ''),
    [grouping, locallyFilteredBoard, selectedId],
  );
  const activeFilterCount = countActiveProposalFilters(search, advancedFilters, role);
  const canCreateProposal = selectedStation?.viewerCanCreateProposals !== false && !!selectedStation;
  const hasQueryError = stationsQuery.isError || programsQuery.isError || boardQuery.isError;
  const isLoading = stationsQuery.isLoading || (Boolean(selectedId) && boardQuery.isLoading) || (grouping === 'program' && programsQuery.isLoading);

  const moveMutation = useMutation({
    mutationFn: ({ id, step }: { id: string; step: ProposalTimelineStep }) => moveProposal(id, step),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.proposals.all });
      showToast('Andamento atualizado.', 'success');
    },
    onError: () => showToast('Nao foi possivel atualizar o andamento.', 'error'),
  });

  const refetchAll = () => {
    stationsQuery.refetch();
    programsQuery.refetch();
    boardQuery.refetch();
  };

  const handleDrop = (proposal: ProgressBoardProposal, step: ProposalTimelineStep) => {
    if (!proposal.viewerCanEdit || proposal.currentStep === step) return;
    moveMutation.mutate({ id: proposal.id, step });
  };

  const removeFilter = (key: 'search' | 'status' | 'createdByName' | 'proposalTypeName' | 'dateFrom' | 'dateTo') => {
    if (key === 'search') setSearch('');
    else {
      setAdvancedFilters((current) => ({ ...current, [key]: undefined }));
      if (key === 'status') router.setParams({ status: undefined });
    }
  };

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="proposal-board-contextual">
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <UIHeader
          title="Propostas"
          subtitle="Acompanhe o andamento por etapa"
          action={canCreateProposal ? (
            <UIButton
              title="Nova"
              accessibilityLabel="Criar nova proposta"
              iconLeft="plus"
              iconSize={18}
              size="md"
              style={styles.newButton}
              onPress={() => router.push('/proposal/new')}
            />
          ) : undefined}
        />
      </View>

      <View style={styles.controls}>
        <BoardContextToolbar
          grouping={grouping}
          density={density}
          contextLabel={contextLabel}
          activeFilterCount={activeFilterCount}
          onGroupingChange={setGrouping}
          onOpenContext={() => setContextOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onToggleDensity={() => setDensity((current) => current === 'focused' ? 'overview' : 'focused')}
        />
        <ActiveProposalFilters search={search} filters={advancedFilters} onRemove={removeFilter} />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Carregando quadro de propostas..." />
      ) : hasQueryError ? (
        <UIEmptyState icon="alert-circle" title="Não foi possível carregar o quadro" actionLabel="Tentar novamente" onAction={refetchAll} />
      ) : !stations.length ? (
        <UIEmptyState icon="radio" title="Nenhuma Empresa disponível" description="Solicite acesso a uma Empresa para acompanhar propostas." />
      ) : !selectedId ? (
        <UIEmptyState icon="columns" title="Selecione um contexto" description="Escolha uma Empresa ou Programa para abrir o Kanban." />
      ) : resultCount === 0 && activeFilterCount > 0 ? (
        <UIEmptyState
          icon="search"
          title="Nenhuma proposta encontrada"
          description="Limpe a busca ou os filtros para ver outras propostas."
          actionLabel="Limpar filtros"
          onAction={() => { setSearch(''); setAdvancedFilters({}); router.setParams({ status: undefined }); }}
        />
      ) : (
        <ContextualProposalKanban
          density={density}
          columns={columns}
          contextKey={`${grouping}:${selectedId}`}
          refreshing={stationsQuery.isFetching || programsQuery.isFetching || boardQuery.isFetching}
          onRefresh={refetchAll}
          onOpen={(proposal) => router.push(`/proposal/${proposal.id}`)}
          onMove={setSelectedProposal}
          onDrop={handleDrop}
        />
      )}

      <ProposalContextSheet
        visible={contextOpen}
        grouping={grouping}
        options={contextOptions}
        selectedId={selectedId}
        onSelect={(id) => setSelection((current) => grouping === 'station' ? { ...current, stationId: id } : { ...current, programId: id })}
        onClose={() => setContextOpen(false)}
      />
      <ProposalSearchOverlay
        visible={searchOpen}
        value={search}
        resultCount={searchResults.length}
        results={searchResults}
        onChangeSearch={setSearch}
        onOpenResult={(proposal) => { setSearchOpen(false); router.push(`/proposal/${proposal.id}`); }}
        onOpenAdvanced={() => { setSearchOpen(false); setFiltersOpen(true); }}
        onClose={() => setSearchOpen(false)}
        onClear={() => setSearch('')}
      />
      <ProposalFiltersSheet
        visible={filtersOpen}
        filters={{ ...advancedFilters, status: advancedFilters.status ?? routeStatus }}
        role={role}
        onClose={() => setFiltersOpen(false)}
        onApply={(next) => setAdvancedFilters(next)}
        onClear={() => { setAdvancedFilters({}); setSearch(''); router.setParams({ status: undefined }); }}
      />
      <MoveProposalSheet
        visible={!!selectedProposal}
        pending={moveMutation.isPending}
        onClose={() => setSelectedProposal(null)}
        onSelect={(step) => {
          if (!selectedProposal) return;
          moveMutation.mutate({ id: selectedProposal.id, step });
          setSelectedProposal(null);
        }}
      />
    </View>
  );
}

function isProposalStatus(value?: string): value is ProposalStatus {
  return value === 'DRAFT' || value === 'SENT' || value === 'APPROVED' || value === 'REJECTED' || value === 'ARCHIVED';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  controls: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  newButton: getNewProposalActionStyle(),
});
