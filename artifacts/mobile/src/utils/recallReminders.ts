import { RecallReminder, RecallReminderListResponse } from '@/src/types';

export type RecallReminderPayload = RecallReminder[] | RecallReminderListResponse | null | undefined;

export function getRecallReminderList(payload: RecallReminderPayload): RecallReminder[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.reminders)) return payload.reminders;
  return [];
}

export function getRecallAdvertiserName(reminder: RecallReminder): string | null {
  return reminder.advertiser?.tradeName ?? reminder.advertiser?.name ?? null;
}

export function getRecallStationName(reminder: RecallReminder): string | null {
  return reminder.stationName ?? reminder.station?.name ?? null;
}
