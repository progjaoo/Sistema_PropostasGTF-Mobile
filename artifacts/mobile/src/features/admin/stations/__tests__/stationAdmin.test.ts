import { impactFixture, stationFixture } from '@/src/test/fixtures/parity';
import { parseStation, parseStationDeletionImpact } from '../api';

describe('admin station operations', () => {
  it('keeps usesPrograms and deletion counts', () => {
    expect(parseStation({ ...stationFixture, usesPrograms: false }).usesPrograms).toBe(false);
    expect(parseStationDeletionImpact(impactFixture).blockers.proposals).toBe(2);
  });
});
