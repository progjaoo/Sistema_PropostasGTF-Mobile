import type { RecallReminder } from '@/src/types';
import { getRecallAdvertiserName, getRecallStationName } from '@/src/utils/recallReminders';

export type RecallAlertFilterState = {
  search?: string;
  status?: RecallReminder['status'] | 'ALL';
  milestone?: number | 'ALL';
};

export function filterRecallAlerts(
  reminders: RecallReminder[],
  filters: RecallAlertFilterState,
): RecallReminder[] {
  const search = filters.search?.trim().toLocaleLowerCase('pt-BR');
  return reminders.filter((reminder) => {
    if (filters.status && filters.status !== 'ALL' && reminder.status !== filters.status) return false;
    if (filters.milestone && filters.milestone !== 'ALL' && reminder.milestoneMonths !== filters.milestone) return false;
    if (!search) return true;
    const haystack = [
      getRecallAdvertiserName(reminder),
      getRecallStationName(reminder),
      reminder.proposal?.clientLine1,
      reminder.proposal?.propType,
      reminder.proposalId,
    ].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    return haystack.includes(search);
  });
}
