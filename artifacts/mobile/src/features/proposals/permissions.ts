import type { AuthUser, Proposal } from '@/src/types';

export function canPermanentlyDeleteProposal({ user, proposal }: { user: Pick<AuthUser, 'id' | 'role'> | null | undefined; proposal: Pick<Proposal, 'createdById' | 'viewerCanEdit'> }): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (proposal.viewerCanEdit === false) return false;
  return proposal.createdById === user.id;
}
