import { ApiError, apiCall } from '@/src/api/client';
import {
  advertiserWithProposalsSchema,
  leadSourceSchema,
} from '@/src/api/schemas';
import type { AdvertiserWithProposals, LeadSource } from '@/src/api/contracts';
import type { AdvertiserStatus } from '@/src/types';

export function getAdvertiserErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 403 || error.status === 404)) return 'Cadastro não encontrado ou sem acesso.';
  return error instanceof Error ? error.message : 'Não foi possível carregar o cadastro.';
}

export function advertiserScopeLabel(advertiser: { ownerId?: string | null }, viewer: { id: string; role: 'ADMIN' | 'COMERCIAL' }): string | null {
  if (!advertiser.ownerId) return null;
  if (viewer.role === 'ADMIN') return `Responsável: ${advertiser.ownerId}`;
  return advertiser.ownerId === viewer.id ? 'Na sua carteira' : 'Cadastro fora da carteira atual';
}

export async function listLeadSources(active = true): Promise<LeadSource[]> {
  const response = await apiCall<unknown>('GET', `/lead-sources${active ? '?active=true' : ''}`);
  return leadSourceSchema.array().parse(response);
}

export async function getAdvertiser(id: string): Promise<AdvertiserWithProposals> {
  return advertiserWithProposalsSchema.parse(await apiCall<unknown>('GET', `/advertisers/${id}`));
}

export async function promoteAdvertiserToClient(id: string): Promise<AdvertiserWithProposals> {
  return advertiserWithProposalsSchema.parse(await apiCall<unknown>('POST', `/advertisers/${id}/promote-to-client`));
}

export async function deactivateAdvertiser(id: string, confirmWithProposals = false): Promise<AdvertiserWithProposals> {
  return advertiserWithProposalsSchema.parse(await apiCall<unknown>('DELETE', `/advertisers/${id}${confirmWithProposals ? '?confirmWithProposals=true' : ''}`));
}

export interface SaveAdvertiserInput {
  tradeName: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
  status: AdvertiserStatus;
  leadSourceId?: string | null;
}

export async function saveAdvertiser(
  id: string | null,
  input: SaveAdvertiserInput,
): Promise<AdvertiserWithProposals> {
  const response = await apiCall<unknown>(
    id ? 'PATCH' : 'POST',
    id ? `/advertisers/${id}` : '/advertisers',
    input,
  );
  return advertiserWithProposalsSchema.parse(response);
}
