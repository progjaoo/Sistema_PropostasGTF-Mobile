import { getProfileFallbackRoute } from '../profileNavigation';

describe('profile navigation', () => {
  it('returns the safest fallback route for each authenticated role', () => {
    expect(getProfileFallbackRoute('ADMIN')).toBe('/(admin)/menu');
    expect(getProfileFallbackRoute('COMERCIAL')).toBe('/(comercial)');
    expect(getProfileFallbackRoute(undefined)).toBe('/(public)/login');
  });
});
