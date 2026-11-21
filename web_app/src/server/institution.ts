// Institution-level reads for the rectorat role. The API's data scope (DataScope) decides what the
// caller may see; this layer only pins every request to the caller's own institution.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { isUuid } from '../lib/validation';
import { SORTS, type StudentFilter } from './unit';

type Raw = Record<string, any>;

const ZERO = '00000000-0000-0000-0000-000000000000';

/**
 * The institution this rectorat user works in. A placeholder in the URL means "mine" (role, then
 * the configured default); a real UUID must equal the role's institution when that is known, so a
 * hand-edited URL can't point the pages at another institution.
 */
export function resolveMyInstitution(auth: AuthState, raw = ''): string {
  if (auth.activeRole !== 'rectorat') throw markSafeError(new Error('Forbidden'));
  const mine = auth.activeRoleItem?.institution_id || auth.defaultInstitutionId || '';
  const v = raw.trim();
  const placeholder = !v || v === '[id]' || v === ':id' || v === ZERO;
  const id = placeholder ? mine : v;
  if (!isUuid(id) || id === ZERO) throw markSafeError(new Error('Institution not found'));
  if (!placeholder && mine && isUuid(mine) && id !== mine) throw markSafeError(new Error('Institution not found'));
  return id;
}

/** The institution's study programs / units (one page, name search done by the API). */
export async function loadInstitutionUnits(institutionId: string, page: number, search: string, pageSize = 20) {
  const res = await apiPaginated<Raw>('institution/master/units', {
    page,
    per_page: pageSize,
    search,
    institution_id: institutionId,
    with_relations: 'true',
  });
  return { ...res, data: res.data.filter((u) => !u.institution_id || u.institution_id === institutionId) };
}

/** One page of the institution's students (all of its units), same filters as the prodi directory. */
export async function loadInstitutionStudents(institutionId: string, f: Pick<StudentFilter, 'page' | 'search' | 'sort'>, pageSize = 20) {
  const [sort_by, sort_dir] = SORTS[f.sort] ?? SORTS['code-asc'];
  return apiPaginated<Raw>('academic/student/master/students', {
    page: f.page,
    per_page: pageSize,
    search: f.search,
    institution_id: institutionId,
    sort_by,
    sort_dir,
  }, { searchParam: 'search' });
}

/** The institution's units as select options (up to 200, A-Z). */
export async function loadInstitutionUnitOptions(institutionId: string) {
  const res = await apiPaginated<Raw>('institution/master/units', { page: 1, per_page: 200, institution_id: institutionId });
  return res.data
    .filter((u) => !u.institution_id || u.institution_id === institutionId)
    .map((u) => ({ id: String(u.id), name: String(u.name ?? u.code ?? u.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The unit a rectorat user is browsing: it must belong to their institution (a foreign or unknown
 * id is "not found"), and with none given the first unit is used. Directories that the API can
 * only filter by unit (lecturers, courses, curricula, classes...) are read per unit.
 */
export async function resolveInstitutionUnit(institutionId: string, raw: string) {
  const units = await loadInstitutionUnitOptions(institutionId);
  if (!raw) {
    if (!units.length) throw markSafeError(new Error('Unit not found'));
    return { unitId: units[0].id, units };
  }
  if (!isUuid(raw) || !units.some((u) => u.id === raw)) throw markSafeError(new Error('Unit not found'));
  return { unitId: raw, units };
}

export interface ActivityFilterInst {
  page: number;
  search: string;
  yearId: string;
  sort: string;
}

/** One page of semester activities of every student of the institution. */
export async function loadInstitutionStudentActivities(institutionId: string, f: ActivityFilterInst, pageSize = 20) {
  return apiPaginated<Raw>('academic/student/campaign/student-activities', {
    page: f.page,
    per_page: pageSize,
    search: f.search,
    institution_id: institutionId,
    academic_year_id: isUuid(f.yearId) ? f.yearId : undefined,
    sort_by: 'student_code',
    sort_dir: 'asc',
  }, { searchParam: 'search' });
}

/**
 * A student of this institution (by student id) and its owner's individual id, for the profile
 * page. A student of another institution is "not found", the same as an unknown id.
 */
export async function loadInstitutionStudent(institutionId: string, studentId: string): Promise<{ id: string; individual_id: string }> {
  const notFound = () => markSafeError(new Error('Student not found'));
  if (!isUuid(studentId)) throw notFound();
  const raw = await apiFetch<Raw>(`academic/student/master/students/${encodeURIComponent(studentId)}`).catch(() => null);
  const st = (raw?.data ?? raw) as Raw | null;
  if (!st?.id || !isUuid(String(st.individual_id ?? '')) || !isUuid(String(st.unit_id ?? ''))) throw notFound();
  const units = await loadInstitutionUnitOptions(institutionId);
  if (!units.some((u) => u.id === st.unit_id)) throw notFound();
  return { id: String(st.id), individual_id: String(st.individual_id) };
}

/** Headline totals for the institution home (only endpoints the API scopes by institution). */
export async function loadInstitutionSummary(institutionId: string) {
  const total = (path: string, extra: Raw = {}) =>
    apiPaginated<Raw>(path, { page: 1, per_page: 1, ...extra }).then((r) => r.pagination.total_data).catch(() => null);
  const inst = { institution_id: institutionId };
  const STUDENTS = 'academic/student/master/students';

  const [units, students, activities, unitOptions, statuses] = await Promise.all([
    total('institution/master/units', inst),
    total(STUDENTS, inst),
    total('academic/student/campaign/student-activities', inst),
    loadInstitutionUnitOptions(institutionId).catch(() => []),
    apiPaginated<Raw>('academic/student/reference/statuses', { page: 1, per_page: 100 }).then((r) => r.data).catch(() => []),
  ]);

  /** Students per study program and per status, from the API's own totals (a page of one row each). */
  const byUnit = await inBatches(unitOptions.slice(0, 60), 10, async (u) => ({ name: u.name, value: (await total(STUDENTS, { ...inst, unit_id: u.id })) ?? 0 }));
  const byStatus = await inBatches(statuses, 10, async (st) => ({ name: String(st.name ?? st.code ?? ''), value: (await total(STUDENTS, { ...inst, status_id: st.id })) ?? 0 }));
  const top = (rows: { name: string; value: number }[]) => rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  return { units, students, activities, studentsByUnit: top(byUnit), studentsByStatus: top(byStatus) };
}

/** Runs `fn` over `items` a few at a time so a big institution doesn't fire hundreds of requests at once. */
async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) out.push(...(await Promise.all(items.slice(i, i + size).map(fn))));
  return out;
}

/** One page of the institution's employees. The API cannot filter by institution, so rows of others are dropped. */
export async function loadInstitutionEmployees(institutionId: string, page: number, search: string, pageSize = 20) {
  const res = await apiPaginated<Raw>('institution/master/employees', { page, per_page: pageSize, search });
  return { ...res, data: res.data.filter((e) => !e.institution_id || e.institution_id === institutionId) };
}

/** One page of the institution's prospective students (candidates). */
export async function loadInstitutionCandidates(institutionId: string, page: number, search: string, pageSize = 20) {
  const res = await apiPaginated<Raw>('academic/candidate/master/candidates', { page, per_page: pageSize, search, institution_id: institutionId });
  return { ...res, data: res.data.filter((c) => !c.institution_id || c.institution_id === institutionId) };
}
