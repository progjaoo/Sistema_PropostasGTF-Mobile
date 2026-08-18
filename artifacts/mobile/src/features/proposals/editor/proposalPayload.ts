import type { Proposal } from '@/src/types';

export type ProposalUpdatePayload = Partial<Omit<Proposal, 'station' | 'advertiser' | 'createdBy' | 'createdAt' | 'updatedAt'>>;

const writableKeys = new Set<keyof ProposalUpdatePayload>([
  'stationId', 'advertiserId', 'proposalTypeId', 'propType', 'propMonth', 'propYear', 'campTag',
  'clientLine1', 'clientLine2', 'dateStart', 'dateEnd', 'periodDesc', 'showPeriod', 'bannerBase64',
  'overlayOpacity', 'stats', 'investDesc', 'investValue', 'contactName', 'contactRole', 'contactPhone', 'products',
]);

export function cleanProposalPatch(patch: Partial<Proposal>): ProposalUpdatePayload {
  return Object.fromEntries(Object.entries(patch).filter(([key]) => writableKeys.has(key as keyof ProposalUpdatePayload))) as ProposalUpdatePayload;
}
