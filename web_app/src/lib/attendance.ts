// Attendance data layer: a query for the meeting list, plain server functions for the rest.
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import {
  closeQrSession, currentQrToken, loadMeetings, loadRoster, openQrSession, saveRoster,
} from '../server/attendance';
import type { QrToken, RosterResponse } from './attendance-types';

export const getMeetings = query(async (teachId: string) => {
  'use server';
  await requireAuth();
  return loadMeetings(teachId);
}, 'teach-meetings');

export async function fetchRoster(meetingId: string): Promise<RosterResponse> {
  'use server';
  await requireAuth();
  return loadRoster(meetingId);
}
export async function saveAttendance(meetingId: string, entries: { student_id: string; attend_type_id: string }[]): Promise<void> {
  'use server';
  await requireAuth();
  await saveRoster(meetingId, entries);
}
export async function startQr(meetingId: string): Promise<QrToken> {
  'use server';
  await requireAuth();
  return openQrSession(meetingId);
}
export async function nextQr(meetingId: string): Promise<QrToken> {
  'use server';
  await requireAuth();
  return currentQrToken(meetingId);
}
export async function stopQr(meetingId: string): Promise<void> {
  'use server';
  await requireAuth();
  await closeQrSession(meetingId);
}
