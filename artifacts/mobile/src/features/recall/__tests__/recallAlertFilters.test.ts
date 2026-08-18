import { filterRecallAlerts } from '../recallAlertFilters';
import type { RecallReminder } from '@/src/types';

const reminders = [
  { id: '1', status: 'PENDING', milestoneMonths: 3, dueAt: '2026-08-01T00:00:00.000Z', proposalId: 'p1', advertiser: { name: 'Alpha' } },
  { id: '2', status: 'DONE', milestoneMonths: 6, dueAt: '2026-08-02T00:00:00.000Z', proposalId: 'p2', advertiser: { name: 'Beta' } },
] as unknown as RecallReminder[];

describe('recall alert filters', () => {
  it('filters by text, status and milestone without changing the source list', () => {
    expect(filterRecallAlerts(reminders, { search: 'alpha' })).toHaveLength(1);
    expect(filterRecallAlerts(reminders, { status: 'DONE' })[0].id).toBe('2');
    expect(filterRecallAlerts(reminders, { milestone: 3 })[0].id).toBe('1');
    expect(reminders).toHaveLength(2);
  });
});
