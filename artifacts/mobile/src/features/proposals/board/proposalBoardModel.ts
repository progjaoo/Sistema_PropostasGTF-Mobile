import type { ProposalProgressBoard, ProgressBoardProposal } from '@/src/api/contracts';
import type { BoardFilters } from '@/src/features/proposals/api';
import type { ProposalTimelineStep, UserRole } from '@/src/types';
import { TIMELINE_STEP_LABELS } from '@/src/utils/enums';

export type BoardGroupingMode = 'station' | 'program';
export type BoardDensityMode = 'focused' | 'overview';
export type ProposalBoardSelection = { stationId?: string; programId?: string };

export const PROPOSAL_STAGES: ProposalTimelineStep[] = [
  'LEAD_CREATED',
  'IN_CONVERSATION',
  'PROPOSAL_SENT',
  'CLIENT_REVIEWING',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
];

export type ProposalStageColumn = {
  step: ProposalTimelineStep;
  label: string;
  proposals: ProgressBoardProposal[];
};

export type ProposalBoardSearchResult = {
  proposal: ProgressBoardProposal;
  programName: string;
  stationName?: string | null;
  locationLabel: string;
};

export function buildProposalStageColumns(
  board: ProposalProgressBoard,
  grouping: BoardGroupingMode,
  selectedId?: string,
): ProposalStageColumn[] {
  const source = grouping === 'program'
    ? board.programs.filter((program) => program.id === selectedId).flatMap((program) => program.proposals)
    : board.programs
      .filter((program) => !selectedId || !program.stationId || program.stationId === selectedId)
      .flatMap((program) => program.proposals);
  const deduped = Array.from(new Map(source.map((proposal) => [proposal.id, proposal])).values());
  return PROPOSAL_STAGES.map((step) => ({
    step,
    label: TIMELINE_STEP_LABELS[step],
    proposals: deduped.filter((proposal) => proposal.currentStep === step),
  }));
}

export function filterProposalBoardLocally(board: ProposalProgressBoard, filters: BoardFilters): ProposalProgressBoard {
  const search = filters.search?.trim().toLocaleLowerCase('pt-BR');
  const createdBy = filters.createdByName?.trim().toLocaleLowerCase('pt-BR');
  const proposalType = filters.proposalTypeName?.trim().toLocaleLowerCase('pt-BR');
  const from = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00.000Z`).getTime() : undefined;
  const to = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59.999Z`).getTime() : undefined;
  return {
    ...board,
    programs: board.programs.map((program) => ({
      ...program,
      proposals: program.proposals.filter((proposal) => {
        if (search && !matchesProposalSearch(program, proposal, search)) return false;
        if (createdBy && !proposal.createdByName.toLocaleLowerCase('pt-BR').includes(createdBy)) return false;
        if (proposalType && !proposal.proposalTypeName.toLocaleLowerCase('pt-BR').includes(proposalType)) return false;
        const updatedAt = proposal.updatedAt ? new Date(proposal.updatedAt).getTime() : undefined;
        if (from !== undefined && updatedAt !== undefined && updatedAt < from) return false;
        if (to !== undefined && updatedAt !== undefined && updatedAt > to) return false;
        return true;
      }),
    })),
  };
}

export function buildProposalSearchResults(
  board: ProposalProgressBoard,
  grouping: BoardGroupingMode,
  selectedId: string | undefined,
  search: string,
): ProposalBoardSearchResult[] {
  const filtered = filterProposalBoardLocally(board, { search: search || undefined });
  const programs = grouping === 'program'
    ? filtered.programs.filter((program) => program.id === selectedId)
    : filtered.programs.filter((program) => !selectedId || !program.stationId || program.stationId === selectedId);
  const byId = new Map<string, ProposalBoardSearchResult>();

  programs.forEach((program) => {
    program.proposals.forEach((proposal) => {
      const current = byId.get(proposal.id);
      if (!current) {
        byId.set(proposal.id, {
          proposal,
          programName: program.name,
          stationName: program.stationName ?? proposal.stationName,
          locationLabel: formatProposalLocation(program.stationName ?? proposal.stationName, program.name),
        });
        return;
      }
      const programNames = new Set(current.programName.split(' · ').filter(Boolean));
      programNames.add(program.name);
      const stationName = current.stationName ?? program.stationName ?? proposal.stationName;
      byId.set(proposal.id, {
        ...current,
        programName: Array.from(programNames).join(' · '),
        stationName,
        locationLabel: formatProposalLocation(stationName, Array.from(programNames).join(' · ')),
      });
    });
  });

  return Array.from(byId.values());
}

export function getFirstPopulatedStageIndex(columns: ProposalStageColumn[]): number {
  const index = columns.findIndex((column) => column.proposals.length > 0);
  return index < 0 ? 0 : index;
}

export function filterWithoutProgram(board: ProposalProgressBoard): ProposalProgressBoard {
  return { ...board, programs: board.programs.filter((program) => program.id === 'sem-programa') };
}

export function countActiveProposalFilters(search: string, filters: BoardFilters, role: UserRole): number {
  const values = [search.trim(), filters.status, filters.proposalTypeName, filters.dateFrom, filters.dateTo];
  if (role === 'ADMIN') values.push(filters.createdByName);
  return values.filter((value) => Boolean(value?.trim())).length;
}

export function isValidIsoBoardDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function matchesProposalSearch(
  program: ProposalProgressBoard['programs'][number],
  proposal: ProgressBoardProposal,
  search: string,
) {
  const values = [
    program.name,
    program.stationName,
    proposal.stationName,
    proposal.advertiserName,
    proposal.proposalTypeName,
    proposal.createdByName,
    ...proposal.products.flatMap((product) => [product.title, product.airTime, product.durationLabel]),
  ];
  return values.some((value) => value?.toLocaleLowerCase('pt-BR').includes(search));
}

function formatProposalLocation(stationName: string | null | undefined, programName: string) {
  const company = stationName ? `Empresa: ${stationName}` : 'Sem Empresa';
  const program = programName ? `Programa: ${programName}` : 'Sem programa';
  return `${company} · ${program}`;
}
