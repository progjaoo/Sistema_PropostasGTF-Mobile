import { getCommercialLegacyRedirect, getCommercialTabs } from '../commercialNavigation';

describe('commercial navigation map', () => {
  it('uses the five commercial destinations', () => {
    expect(getCommercialTabs().map((tab) => tab.name)).toEqual([
      'index', 'clients', 'products', 'contracts', 'more',
    ]);
  });

  it('redirects legacy routes to the new hubs', () => {
    expect(getCommercialLegacyRedirect('leads')).toBe('/(comercial)/clients?segment=LEAD');
    expect(getCommercialLegacyRedirect('alerts')).toBe('/(comercial)/more?section=alerts');
    expect(getCommercialLegacyRedirect('profile')).toBe('/(comercial)/more?section=profile');
  });
});
