import type { AuthUser } from '@/src/types';

export function getProfileFallbackRoute(role?: AuthUser['role']) {
  if (role === 'ADMIN') return '/(admin)/menu';
  if (role === 'COMERCIAL') return '/(comercial)';
  return '/(public)/login';
}
