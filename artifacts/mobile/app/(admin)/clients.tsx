import React from 'react';

import { AdvertiserListScreen } from '@/src/features/advertisers/AdvertiserListScreen';

export default function AdminClientsScreen() {
  return (
    <AdvertiserListScreen
      title="Clientes e Leads"
      subtitle="Acompanhe cadastros comerciais, clientes ativos e oportunidades abertas."
      queryKeyPrefix="admin-advertisers"
      allowStatusFilter
      showNewLeadAction
      emptyTitle="Nenhum cadastro encontrado"
      emptyDescription="Clientes e leads aparecerão aqui conforme forem cadastrados."
    />
  );
}
