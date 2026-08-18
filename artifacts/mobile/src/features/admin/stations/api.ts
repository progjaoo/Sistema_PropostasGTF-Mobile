import { apiCall } from '@/src/api/client';
import { stationDeletionImpactSchema, stationSchema } from '@/src/api/schemas';
import type { Station } from '@/src/types';
import type { StationDeletionImpact } from '@/src/api/contracts';

export const parseStation = (input: unknown): Station => stationSchema.parse(input) as Station;
export const parseStationDeletionImpact = (input: unknown): StationDeletionImpact => stationDeletionImpactSchema.parse(input);

export async function getStationDeletionImpact(id: string): Promise<StationDeletionImpact> {
  return parseStationDeletionImpact(await apiCall('GET', `/stations/${id}/deletion-impact`));
}

export function deactivateStation(id: string) {
  return apiCall<Station>('DELETE', `/stations/${id}`);
}

export function permanentlyDeleteStation(id: string) {
  return apiCall<{ id: string; message: string }>('DELETE', `/stations/${id}/permanent`);
}
