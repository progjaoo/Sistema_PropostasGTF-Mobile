import React from 'react';

import { AdvertiserListScreen } from '@/src/features/advertisers/AdvertiserListScreen';

export default function LeadsScreen() {
  return (
    <AdvertiserListScreen
      title="Leads"
      subtitle="Registre oportunidades e acompanhe contatos ainda não convertidos."
      queryKeyPrefix="advertisers-leads"
      initialStatus="LEAD"
      showNewLeadAction
      emptyTitle="Nenhum lead"
      emptyDescription="Adicione leads para acompanhar novas oportunidades comerciais."
    />
  );
}
