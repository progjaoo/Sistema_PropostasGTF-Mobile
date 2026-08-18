import { apiCall } from '@/src/api/client';
import type { ProductTemplate, Station } from '@/src/types';

export type CommercialProductFilters = { search?: string; stationId?: string; programId?: string; active?: boolean };

function toQuery(filters: CommercialProductFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  const query = params.toString();
  return query ? `?${query}` : '';
}

export async function listCommercialProducts(filters: CommercialProductFilters = {}): Promise<ProductTemplate[]> {
  return apiCall<ProductTemplate[]>('GET', `/product-templates${toQuery(filters)}`);
}

export async function listCommercialStations(): Promise<Station[]> {
  return apiCall<Station[]>('GET', '/stations?active=true');
}
