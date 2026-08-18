import type { AuthUser } from '@/src/types';

export function getProfileFallbackRoute(role?: AuthUser['role']) {
  if (role === 'ADMIN') return '/(admin)/menu';
  if (role === 'COMERCIAL') return '/(comercial)';
  return '/(public)/login';
}

export function shouldRedirectLegacyProfile(pathname: string, legacy?: string) {
  const openedFromAdminMenu = pathname === '/admin/profile' || pathname.endsWith('/admin/profile');
  return legacy !== '1' && !openedFromAdminMenu;
}
