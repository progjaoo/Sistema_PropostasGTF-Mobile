import { getNewProposalActionStyle } from '../proposalBoardUi';

describe('proposal board UI contracts', () => {
  it('keeps the new proposal CTA readable and touch friendly on mobile', () => {
    expect(getNewProposalActionStyle()).toMatchObject({
      minHeight: 46,
      borderRadius: 16,
      paddingHorizontal: 14,
    });
  });
});
