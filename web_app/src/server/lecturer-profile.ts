// The administrator's lecturer page: the record, its reference names and the yearly credit trend.
import { markSafeError } from '@solidjs/web';

import { apiFetch } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { redact } from './admin-crud';
import { LECTURER_REFERENCES, normaliseTrends, parseLectureChart } from '../lib/lecturer-profile';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;
const labelOf = (o: Raw | null, fallback: string) => (o ? [o.code, o.name].filter((x) => x !== undefined && x !== null && x !== '').join(' · ') || fallback : fallback);

export async function loadLecturerProfile(auth: AuthState, id: string) {
  requireAdministrator(auth);
  if (!isUuid(id)) throw markSafeError(new Error('Not found'));
  const lecturer = await apiFetch<Raw>(`academic/lecturer/master/lecturers/${enc(id)}`).then(body).catch(() => null);
  if (!lecturer?.id) throw markSafeError(new Error('Not found'));

  const [names, trends, classes] = await Promise.all([
    Promise.all(
      Object.entries(LECTURER_REFERENCES)
        .filter(([f]) => isUuid(String(lecturer[f] ?? '')))
        .map(async ([f, api]) => [f, labelOf(await apiFetch<Raw>(`${api}/${enc(String(lecturer[f]))}`).then(body).catch(() => null), String(lecturer[f]))] as const),
    ).then((entries) => Object.fromEntries(entries) as Record<string, string>),
    apiFetch<unknown>(`academic/lecturer/master/lecturers/${enc(id)}/yearly-credit-trends`).then(normaliseTrends).catch(() => []),
    apiFetch<unknown>(`academic/lecturer/master/lecturers/${enc(id)}/teach-lecture-chart`).then(parseLectureChart).catch(() => ({ categories: [] as string[], values: [] as number[] })),
  ]);
  return { lecturer: redact(lecturer), names, trends, classes };
}

export type LecturerProfile = Awaited<ReturnType<typeof loadLecturerProfile>>;
