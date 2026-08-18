export type CommercialTabName = 'index' | 'clients' | 'products' | 'contracts' | 'more';

export type CommercialTab = {
  name: CommercialTabName;
  title: string;
  iosIcon: string;
  featherIcon: string;
};

const tabs: CommercialTab[] = [
  { name: 'index', title: 'Propostas', iosIcon: 'doc.text', featherIcon: 'file-text' },
  { name: 'clients', title: 'Clientes', iosIcon: 'person.2', featherIcon: 'users' },
  { name: 'products', title: 'Produtos', iosIcon: 'shippingbox', featherIcon: 'package' },
  { name: 'contracts', title: 'Contratos', iosIcon: 'signature', featherIcon: 'file-text' },
  { name: 'more', title: 'Mais', iosIcon: 'ellipsis.circle', featherIcon: 'more-horizontal' },
];

export function getCommercialTabs(): CommercialTab[] {
  return tabs.map((tab) => ({ ...tab }));
}

export function getCommercialLegacyRedirect(path: 'leads' | 'alerts' | 'profile'): string {
  if (path === 'leads') return '/(comercial)/clients?segment=LEAD';
  return `/(comercial)/more?section=${path}`;
}
