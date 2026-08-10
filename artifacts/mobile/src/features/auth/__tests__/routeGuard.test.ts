import { resolveAuthenticatedRoute } from '../routeGuard';

describe('authenticated route guard', () => {
  it('routes anonymous users to login', () => {
    expect(resolveAuthenticatedRoute(null)).toBe('/(public)/login');
  });

  it('keeps roles in their allowed navigation group', () => {
    expect(resolveAuthenticatedRoute('ADMIN', 'comercial')).toBe('/(admin)');
    expect(resolveAuthenticatedRoute('COMERCIAL', 'admin')).toBe('/(comercial)');
  });
});

