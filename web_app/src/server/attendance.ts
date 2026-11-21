// Teaching attendance: thin, validated wrappers over the Rust API. The API enforces
// that the caller teaches the class; here we only make sure ids are UUIDs (they end up
// in API paths) and shape the bodies.
import { markSafeError } from '@solidjs/web';

import { apiFetch } from './api';
import { asList } from '../lib/student-select';
import type { MeetingItem, QrToken, RosterResponse } from '../lib/attendance-types';
import { isUuid } from '../lib/validation';

const ROOT = 'academic/campaign/transaction';
const enc = encodeURIComponent;

export function uuid(v: string, what = 'id'): string {
  if (!isUuid(v)) throw markSafeError(new Error(`Invalid ${what}`));
  return v;
}

/**
 * Writing attendance needs the meeting to belong to the class and the class not to be locked by
 * the study program (the API enforces ownership, not the lock).
 */
/** Is the class locked by the study program? (Reading attendance stays possible; writing is not.) */
export async function isClassLocked(teachId: string): Promise<boolean> {
  const raw = await apiFetch<Record<string, any>>(`${ROOT}/teaches/${enc(uuid(teachId, 'teach'))}`);
  return Boolean(((raw.data ?? raw) as Record<string, any>).is_lock);
}

export async function assertClassOpen(teachId: string, meetingId: string): Promise<void> {
  if (await isClassLocked(teachId)) throw markSafeError(new Error('classLocked'));
  const meetings = await loadMeetings(teachId);
  if (!meetings.some((m) => m.id === meetingId)) throw markSafeError(new Error('Meeting not found'));
}

export async function loadMeetings(teachId: string): Promise<MeetingItem[]> {
  const res = await apiFetch<unknown>(`${ROOT}/teach-meetings`, { query: { teach_id: uuid(teachId, 'teach') } });
  return asList<MeetingItem>(res).sort((a, b) => a.sequence - b.sequence);
}

export async function loadRoster(meetingId: string): Promise<RosterResponse> {
  const r = await apiFetch<Partial<RosterResponse>>(`${ROOT}/teach-meetings/${enc(uuid(meetingId, 'meeting'))}/attendances`);
  return { attend_types: r.attend_types ?? [], entries: r.entries ?? [] };
}

export async function saveRoster(meetingId: string, entries: { student_id: string; attend_type_id: string }[]) {
  if (entries.length === 0 || entries.length > 1000) throw markSafeError(new Error('Invalid entries'));
  for (const e of entries) {
    uuid(e.student_id, 'student');
    uuid(e.attend_type_id, 'attendance type');
  }
  await apiFetch(`${ROOT}/teach-meetings/${enc(uuid(meetingId, 'meeting'))}/attendances`, { method: 'PUT', body: { entries } });
}

const qrPath = (meetingId: string) => `${ROOT}/teach-meetings/${enc(uuid(meetingId, 'meeting'))}/qr`;
export const openQrSession = (meetingId: string, minutes?: number) =>
  apiFetch<QrToken>(qrPath(meetingId), { method: 'POST', body: { minutes } });
export const currentQrToken = (meetingId: string) => apiFetch<QrToken>(qrPath(meetingId));
export const closeQrSession = (meetingId: string) => apiFetch(qrPath(meetingId), { method: 'DELETE' });
