import { canPermanentlyDeleteProposal } from '../permissions';

const admin = { id: 'admin', role: 'ADMIN' as const };
const sellerA = { id: 'seller-a', role: 'COMERCIAL' as const };
const sellerAProposal = { createdById: 'seller-a', viewerCanEdit: true };
const sellerBProposal = { createdById: 'seller-b', viewerCanEdit: true };

describe('proposal deletion permissions', () => {
  it('allows admin and the owner, but not another wallet', () => {
    expect(canPermanentlyDeleteProposal({ user: admin, proposal: sellerBProposal })).toBe(true);
    expect(canPermanentlyDeleteProposal({ user: sellerA, proposal: sellerAProposal })).toBe(true);
    expect(canPermanentlyDeleteProposal({ user: sellerA, proposal: sellerBProposal })).toBe(false);
    expect(canPermanentlyDeleteProposal({ user: sellerA, proposal: { ...sellerAProposal, viewerCanEdit: false } })).toBe(false);
  });
});
