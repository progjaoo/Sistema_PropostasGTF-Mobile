import type { UserRole, UserStationAccess } from '@/src/types';

export interface AdminUserFormValue {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
  jobTitle?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  avatarBase64?: string | null;
  stationAccesses: UserStationAccess[];
}

export function buildAdminUserPayload(value: AdminUserFormValue) {
  return {
    name: value.name.trim(),
    email: value.email.trim().toLowerCase(),
    ...(value.password ? { password: value.password } : {}),
    role: value.role,
    active: value.active,
    jobTitle: value.jobTitle?.trim() || null,
    contactPhone: value.contactPhone?.trim() || null,
    contactEmail: value.contactEmail?.trim().toLowerCase() || null,
    avatarBase64: value.avatarBase64 ?? null,
    stationAccesses: value.role === 'ADMIN' ? [] : value.stationAccesses.filter((access) => access.active).map((access) => ({
      stationId: access.stationId,
      canCreateProposals: access.canCreateProposals,
      canViewCatalog: access.canViewCatalog,
      active: true,
    })),
  };
}
