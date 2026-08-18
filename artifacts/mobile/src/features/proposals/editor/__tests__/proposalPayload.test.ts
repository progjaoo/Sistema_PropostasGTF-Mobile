import { cleanProposalPatch } from '../proposalPayload';
import { makeUser, stationFixture } from '@/src/test/fixtures/parity';

describe('proposal payload', () => {
  it('removes nested read-only objects before saving', () => {
    expect(cleanProposalPatch({
      investValue: '1500.00',
      station: stationFixture,
      createdBy: makeUser(),
    })).toEqual({ investValue: '1500.00' });
  });
});
