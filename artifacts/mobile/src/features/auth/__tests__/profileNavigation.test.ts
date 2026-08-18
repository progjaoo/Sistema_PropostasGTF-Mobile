import { getProfileFallbackRoute, shouldRedirectLegacyProfile } from '../profileNavigation';

describe('profile navigation', () => {
  it('returns the safest fallback route for each authenticated role', () => {
    expect(getProfileFallbackRoute('ADMIN')).toBe('/(admin)/menu');
    expect(getProfileFallbackRoute('COMERCIAL')).toBe('/(comercial)');
    expect(getProfileFallbackRoute(undefined)).toBe('/(public)/login');
  });

  it('keeps the admin menu profile route on the profile screen', () => {
    expect(shouldRedirectLegacyProfile('/admin/profile')).toBe(false);
    expect(shouldRedirectLegacyProfile('/(comercial)/profile')).toBe(true);
    expect(shouldRedirectLegacyProfile('/(comercial)/profile', '1')).toBe(false);
  });
});
