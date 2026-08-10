import React from 'react';

import { AdvertiserListScreen } from '@/src/features/advertisers/AdvertiserListScreen';

export default function ClientsScreen() {
  return (
    <AdvertiserListScreen
      title="Clientes"
      subtitle="Consulte clientes vinculados ao fluxo comercial."
      queryKeyPrefix="advertisers-clients"
      initialStatus="CLIENT"
      emptyTitle="Nenhum cliente"
      emptyDescription="Os clientes aparecem aqui após uma proposta ser aceita."
    />
  );
}
