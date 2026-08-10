import { apiCall } from '@/src/api/client';
import {
  advertiserWithProposalsSchema,
  leadSourceSchema,
} from '@/src/api/schemas';
import type { AdvertiserWithProposals, LeadSource } from '@/src/api/contracts';
import type { AdvertiserStatus } from '@/src/types';

export async function listLeadSources(active = true): Promise<LeadSource[]> {
  const response = await apiCall<unknown>('GET', `/lead-sources${active ? '?active=true' : ''}`);
  return leadSourceSchema.array().parse(response);
}

export async function getAdvertiser(id: string): Promise<AdvertiserWithProposals> {
  return advertiserWithProposalsSchema.parse(await apiCall<unknown>('GET', `/advertisers/${id}`));
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

