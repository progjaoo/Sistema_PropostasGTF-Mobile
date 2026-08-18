import React from 'react';
import { useLocalSearchParams } from 'expo-router';

import { AdvertiserListScreen } from '@/src/features/advertisers/AdvertiserListScreen';
import type { AdvertiserStatus } from '@/src/types';

export default function ClientsScreen() {
  const { segment } = useLocalSearchParams<{ segment?: AdvertiserStatus }>();
  return (
    <AdvertiserListScreen
      title={segment === 'LEAD' ? 'Leads' : 'Clientes'}
      subtitle={segment === 'LEAD' ? 'Acompanhe oportunidades ainda não convertidas.' : 'Consulte clientes vinculados ao fluxo comercial.'}
      queryKeyPrefix="advertisers-commercial"
      initialStatus={segment === 'LEAD' ? 'LEAD' : 'CLIENT'}
      showNewLeadAction={segment === 'LEAD'}
      showLeadConversionAction={segment !== 'LEAD'}
      showClientLeadSegments
      emptyTitle={segment === 'LEAD' ? 'Nenhum lead' : 'Nenhum cliente'}
      emptyDescription={segment === 'LEAD' ? 'Adicione leads para acompanhar oportunidades.' : 'Os clientes aparecem aqui após uma proposta ser aceita.'}
    />
  );
}
