import { useQuery } from '@tanstack/react-query';
import { apiCall } from '@/src/api/client';
import { queryKeys } from '@/src/api/queryKeys';
import { stationSchema } from '@/src/api/schemas';
import type { Station } from '@/src/types';
import { getProposalBoard, type BoardFilters } from '../api';
import {
  filterWithoutProgram,
  type BoardGroupingMode,
  type ProposalBoardSelection,
} from './proposalBoardModel';

export async function listProposalBoardStations(): Promise<Station[]> {
  const payload = await apiCall<unknown>('GET', '/stations?active=true');
  return stationSchema.array().parse(payload).filter((station) => station.active) as Station[];
}

export function getContextBoardFilters(
  grouping: BoardGroupingMode,
  selection: ProposalBoardSelection,
  filters: BoardFilters,
): BoardFilters {
  const base: BoardFilters = {};
  if (filters.search) base.search = filters.search;
  if (filters.status) base.status = filters.status;
  if (grouping === 'station') {
    return selection.stationId ? { ...base, stationId: selection.stationId } : base;
  }
  return selection.programId && selection.programId !== 'sem-programa'
    ? { ...base, programId: selection.programId }
    : base;
}

export function useContextualProposalBoard(args: {
  grouping: BoardGroupingMode;
  selection: ProposalBoardSelection;
  filters: BoardFilters;
}) {
  const selectedId = args.grouping === 'station' ? args.selection.stationId : args.selection.programId;
  const requestFilters = getContextBoardFilters(args.grouping, args.selection, args.filters);
  const stationsQuery = useQuery({
    queryKey: queryKeys.stations.all,
    queryFn: listProposalBoardStations,
  });
  const programsQuery = useQuery({
    queryKey: queryKeys.proposals.contextPrograms,
    queryFn: () => getProposalBoard({}),
    enabled: args.grouping === 'program',
  });
  const boardQuery = useQuery({
    queryKey: queryKeys.proposals.contextBoard(args.grouping, selectedId, { ...requestFilters }),
    queryFn: () => getProposalBoard(requestFilters),
    enabled: Boolean(selectedId),
  });
  const board = args.grouping === 'program' && selectedId === 'sem-programa'
    ? filterWithoutProgram(boardQuery.data ?? { programs: [] })
    : boardQuery.data ?? { programs: [] };
  return { stationsQuery, programsQuery, boardQuery, board };
}
