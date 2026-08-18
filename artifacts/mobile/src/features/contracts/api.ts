import { apiCall } from '@/src/api/client';
import {
  commercialContractForecastSchema,
  commercialContractSchema,
  commercialContractSummarySchema,
  eligibleContractProposalSchema,
} from '@/src/api/schemas';
import type {
  CommercialContract,
  CommercialContractForecastResponse,
  CommercialContractSummary,
  EligibleContractProposal,
} from '@/src/api/contracts';

function toQuery(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  const value = params.toString();
  return value ? `?${value}` : '';
}

export async function listContracts(filters: { ownerId?: string } = {}): Promise<CommercialContract[]> {
  const payload = await apiCall<unknown>('GET', `/contracts${toQuery(filters)}`);
  return Array.isArray(payload) ? payload.map((item) => commercialContractSchema.parse(item)) : [];
}

export async function getContractSummary(month?: string, ownerId?: string): Promise<CommercialContractSummary> {
  return commercialContractSummarySchema.parse(await apiCall('GET', `/contracts/summary${toQuery({ month, ownerId })}`));
}

export async function getContractForecast(from?: string, months = 12, ownerId?: string): Promise<CommercialContractForecastResponse> {
  return commercialContractForecastSchema.parse(await apiCall('GET', `/contracts/forecast${toQuery({ from, months, ownerId })}`));
}

export async function listEligibleProposals(): Promise<EligibleContractProposal[]> {
  const payload = await apiCall<{ data?: unknown[] }>('GET', '/contracts/eligible-proposals');
  return (payload.data ?? []).map((item) => eligibleContractProposalSchema.parse(item)) as EligibleContractProposal[];
}

export function createContract(input: {
  proposalId: string; monthlyValue: string; saleDate: string; startDate: string; endDate: string; installmentDueDay: number; notes?: string | null;
}) {
  return apiCall<CommercialContract>('POST', '/contracts', input);
}

export function updateContract(id: string, input: Partial<Omit<Parameters<typeof createContract>[0], 'proposalId'>>) {
  return apiCall<CommercialContract>('PATCH', `/contracts/${id}`, input);
}

export function cancelContract(id: string) {
  return apiCall<CommercialContract>('POST', `/contracts/${id}/cancel`);
}
