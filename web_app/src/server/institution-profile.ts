// What the administrator's institution page shows: the record with its reference names, headline
// totals and the units. Totals come from the API's own counts (a page of one row); a source that
// fails or ignores the filter shows as "unknown" instead of blanking the page.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { redact } from './admin-crud';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;

/** Reference fields of an institution: field -> endpoint. */
export const INSTITUTION_REFERENCES: Record<string, string> = {
  variety_id: 'institution/reference/varieties',
  category_id: 'institution/reference/categories',
  country_id: 'countries',
  parent_id: 'institution/master/institutions',
  academic_year_id: 'academic/general/reference/academic-years',
};

/** Totals shown on the page: label key -> endpoint filtered by `institution_id`. */
export const INSTITUTION_TOTALS: { key: string; label: string; api: string }[] = [
  { key: 'units', label: 'ad.units', api: 'institution/master/units' },
  { key: 'students', label: 'ad.students', api: 'academic/student/master/students' },
  { key: 'candidates', label: 'ad.candidates', api: 'academic/candidate/master/candidates' },
  { key: 'employees', label: 'ad.employees', api: 'institution/master/employees' },
];

const labelOf = (o: Raw | null, fallback: string) => (o ? [o.code, o.name].filter((x) => x !== undefined && x !== null && x !== '').join(' · ') || fallback : fallback);

export async function loadInstitutionProfile(auth: AuthState, id: string) {
  requireAdministrator(auth);
  if (!isUuid(id)) throw markSafeError(new Error('Not found'));
  const institution = await apiFetch<Raw>(`institution/master/institutions/${enc(id)}`).then(body).catch(() => null);
  if (!institution?.id) throw markSafeError(new Error('Not found'));

  const [names, totals, units] = await Promise.all([
    Promise.all(
      Object.entries(INSTITUTION_REFERENCES)
        .filter(([f]) => isUuid(String(institution[f] ?? '')))
        .map(async ([f, api]) => [f, labelOf(await apiFetch<Raw>(`${api}/${enc(String(institution[f]))}`).then(body).catch(() => null), String(institution[f]))] as const),
    ).then(Object.fromEntries as (e: (readonly [string, string])[]) => Record<string, string>),
    Promise.all(
      INSTITUTION_TOTALS.map(async (t) => ({
        key: t.key,
        label: t.label,
        value: await apiPaginated<Raw>(t.api, { page: 1, per_page: 1, institution_id: id }).then((r) => r.pagination.total_data).catch(() => null),
      })),
    ),
    apiPaginated<Raw>('institution/master/units', { page: 1, per_page: 30, institution_id: id })
      .then((r) => r.data.filter((u) => !u.institution_id || u.institution_id === id).map((u) => ({ id: String(u.id), name: String(u.name ?? u.code ?? u.id), code: String(u.code ?? '') })))
      .catch(() => []),
  ]);

  return { institution: redact(institution), names, totals, units };
}

export type InstitutionProfile = Awaited<ReturnType<typeof loadInstitutionProfile>>;
