import { apiCall } from '@/src/api/client';
import { proposalProgramBoardSchema, proposalProgressBoardSchema } from '@/src/api/schemas';
import type { ProposalProgramBoard, ProposalProgressBoard } from '@/src/api/contracts';
import type { Proposal, ProposalTimelineStep, ProposalVersion } from '@/src/types';

export interface BoardFilters {
  search?: string;
  stationId?: string;
  programId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  createdByName?: string;
  proposalTypeName?: string;
}

export async function getProposalBoard(filters: BoardFilters): Promise<ProposalProgressBoard> {
  const params = new URLSearchParams();
  Object.entries(toBackendBoardFilters(filters)).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const payload = await apiCall<unknown>('GET', `/proposals/progress-board${suffix}`);
  return parseProgressBoardPayload(payload);
}

export async function getProposalProgramBoard(filters: BoardFilters): Promise<ProposalProgramBoard> {
  const params = new URLSearchParams();
  Object.entries(toBackendBoardFilters(filters)).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const suffix = params.toString() ? `?${params}` : '';
  const payload = await apiCall<unknown>('GET', `/proposals/program-board${suffix}`);
  return parseProgramBoardPayload(payload);
}

export async function moveProposal(proposalId: string, step: ProposalTimelineStep, note?: string) {
  return apiCall('POST', `/proposals/${proposalId}/timeline`, { step, note });
}

export async function duplicateProposal(proposalId: string) {
  return apiCall<{ id: string }>('POST', `/proposals/${proposalId}/duplicate`);
}

export async function deleteProposal(proposalId: string) {
  return apiCall<{ message: string }>('DELETE', `/proposals/${proposalId}`);
}

export async function getProposalVersionDetail(proposalId: string, versionId: string): Promise<ProposalVersion> {
  return apiCall<ProposalVersion>('GET', `/proposals/${proposalId}/versions/${versionId}`);
}

export async function restoreProposalFromSnapshot(proposalId: string, snapshot: unknown): Promise<Proposal> {
  const proposal = snapshot as Partial<Proposal>;
  return apiCall<Proposal>('PATCH', `/proposals/${proposalId}`, {
    stationId: proposal.stationId ?? null,
    advertiserId: proposal.advertiserId ?? null,
    proposalTypeId: proposal.proposalTypeId ?? null,
    propType: proposal.propType,
    propMonth: proposal.propMonth,
    propYear: proposal.propYear,
    campTag: proposal.campTag ?? null,
    clientLine1: proposal.clientLine1 ?? null,
    clientLine2: proposal.clientLine2 ?? null,
    dateStart: proposal.dateStart ?? null,
    dateEnd: proposal.dateEnd ?? null,
    periodDesc: proposal.periodDesc ?? null,
    showPeriod: proposal.showPeriod ?? true,
    bannerBase64: proposal.bannerBase64 ?? null,
    overlayOpacity: proposal.overlayOpacity ?? 0,
    stats: proposal.stats ?? [],
    investDesc: proposal.investDesc ?? null,
    investValue: proposal.investValue ?? null,
    contactName: proposal.contactName ?? null,
    contactRole: proposal.contactRole ?? null,
    contactPhone: proposal.contactPhone ?? null,
    products: (proposal.products ?? []).map((product, order) => ({
      productTemplateId: product.productTemplateId ?? null,
      order,
      qty: product.qty || '01',
      title: product.title,
      description: product.description ?? null,
      detail: product.detail ?? null,
      program: product.program ?? null,
      durationLabel: product.durationLabel ?? null,
      airTime: product.airTime ?? null,
      seasonality: product.seasonality ?? null,
      tags: product.tags ?? [],
      color: product.color || 'BLUE',
    })),
  });
}

function toBackendBoardFilters(filters: BoardFilters) {
  return {
    search: filters.search,
    stationId: filters.stationId,
    programId: filters.programId === 'sem-programa' ? undefined : filters.programId,
    status: filters.status,
  };
}

function parseProgressBoardPayload(payload: unknown): ProposalProgressBoard {
  const normalized = normalizeBoardPayload(payload);
  const parsed = proposalProgressBoardSchema.safeParse(normalized);
  if (parsed.success) return parsed.data;

  console.warn('[mobile/proposals] progress-board fora do contrato esperado', parsed.error.issues);
  return {
    programs: normalizePrograms((normalized as any)?.programs),
  };
}

function parseProgramBoardPayload(payload: unknown): ProposalProgramBoard {
  const normalized = normalizeBoardPayload(payload);
  const parsed = proposalProgramBoardSchema.safeParse(normalized);
  if (parsed.success) return parsed.data;

  console.warn('[mobile/proposals] program-board fora do contrato esperado', parsed.error.issues);
  return {
    programs: normalizePrograms((normalized as any)?.programs).map((program) => ({
      ...program,
      slug: program.id,
      description: null,
      icon: null,
      primaryColor: null,
      products: [],
      proposals: program.proposals.map((proposal) => ({
        ...proposal,
        advertiserId: null,
      })),
    })),
  };
}

function normalizeBoardPayload(payload: unknown) {
  const value = payload as any;
  if (Array.isArray(value?.programs)) return value;
  if (Array.isArray(value?.data?.programs)) return value.data;
  if (Array.isArray(value?.data)) {
    return {
      programs: [
        {
          id: 'sem-programa',
          name: 'Sem programa',
          stationId: null,
          stationName: null,
          proposals: value.data,
        },
      ],
    };
  }
  return { programs: [] };
}

function normalizePrograms(programs: unknown): ProposalProgressBoard['programs'] {
  if (!Array.isArray(programs)) return [];
  return programs.map((program, index) => {
    const raw = program as any;
    const id = normalizeText(raw?.id, `program-${index}`);
    return {
      id,
      name: normalizeText(raw?.name, 'Sem programa'),
      stationId: normalizeNullableText(raw?.stationId),
      stationName: normalizeNullableText(raw?.stationName),
      proposals: normalizeProposals(raw?.proposals),
    };
  });
}

function normalizeProposals(proposals: unknown): ProposalProgressBoard['programs'][number]['proposals'] {
  if (!Array.isArray(proposals)) return [];
  return proposals.map((proposal, index) => {
    const raw = proposal as any;
    return {
      id: normalizeText(raw?.id, `proposal-${index}`),
      status: normalizeProposalStatus(raw?.status),
      currentStep: normalizeProposalStep(raw?.currentStep),
      proposalTypeName: normalizeText(raw?.proposalTypeName, 'Proposta comercial'),
      advertiserName: normalizeNullableText(raw?.advertiserName),
      stationName: normalizeNullableText(raw?.stationName),
      createdByName: normalizeText(raw?.createdByName, 'Sem responsavel'),
      updatedAt: normalizeNullableText(raw?.updatedAt) ?? undefined,
      investValue: normalizeNullableText(raw?.investValue),
      products: normalizeProducts(raw?.products),
    };
  });
}

function normalizeProducts(products: unknown): ProposalProgressBoard['programs'][number]['proposals'][number]['products'] {
  if (!Array.isArray(products)) return [];
  return products.map((product, index) => {
    const raw = product as any;
    return {
      id: normalizeText(raw?.id, `product-${index}`),
      title: normalizeText(raw?.title, 'Produto sem nome'),
      qty: normalizeText(raw?.qty, '01'),
      airTime: normalizeNullableText(raw?.airTime),
      durationLabel: normalizeNullableText(raw?.durationLabel),
      seasonality: normalizeSeasonality(raw?.seasonality),
    };
  });
}

function normalizeText(value: unknown, fallback: string): string {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeProposalStatus(value: unknown): ProposalProgressBoard['programs'][number]['proposals'][number]['status'] {
  if (value === 'DRAFT' || value === 'SENT' || value === 'APPROVED' || value === 'REJECTED' || value === 'ARCHIVED') {
    return value;
  }
  return 'DRAFT';
}

function normalizeProposalStep(value: unknown): ProposalProgressBoard['programs'][number]['proposals'][number]['currentStep'] {
  if (
    value === 'LEAD_CREATED' ||
    value === 'IN_CONVERSATION' ||
    value === 'PROPOSAL_SENT' ||
    value === 'CLIENT_REVIEWING' ||
    value === 'NEGOTIATION' ||
    value === 'APPROVED' ||
    value === 'REJECTED'
  ) {
    return value;
  }
  return 'IN_CONVERSATION';
}

function normalizeSeasonality(value: unknown): ProposalProgressBoard['programs'][number]['proposals'][number]['products'][number]['seasonality'] {
  if (value === 'MONTHLY' || value === 'SEMIANNUAL' || value === 'ANNUAL') return value;
  return undefined;
}
