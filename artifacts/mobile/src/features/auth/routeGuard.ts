import type { UserRole } from '@/src/types';

export type AuthRoute =
  | '/(public)/login'
  | '/(admin)'
  | '/(comercial)';

export function resolveAuthenticatedRoute(
  role: UserRole | null | undefined,
  requestedGroup?: 'admin' | 'comercial',
): AuthRoute {
  if (!role) return '/(public)/login';
  if (role === 'ADMIN') return '/(admin)';
  if (requestedGroup === 'admin') return '/(comercial)';
  return '/(comercial)';
}

