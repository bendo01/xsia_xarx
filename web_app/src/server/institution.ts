// Institution-level reads for the rectorat role. The API's data scope (DataScope) decides what the
// caller may see; this layer only pins every request to the caller's own institution.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { isUuid } from '../lib/validation';
import { SORTS, loadUnitDashboard, type StudentFilter } from './unit';
import { withData, meanLine, sumLines, sumSlices, totalsPerCategory, trimTrailingEmpty } from '../lib/analytics';
import { lineFromOption, slicesFromOption } from '../lib/unit-dashboard';

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
// Every list of the rectorat area validates the chosen unit against this list, and its picker shows it:
// remember it for a few minutes instead of asking on every page. Only a successful answer is kept.
const UNITS_TTL_MS = 5 * 60_000;
const unitOptionCache = new Map<string, { at: number; data: { id: string; name: string }[] }>();

export async function loadInstitutionUnitOptions(institutionId: string) {
  const hit = unitOptionCache.get(institutionId);
  if (hit && Date.now() - hit.at < UNITS_TTL_MS) return hit.data;
  const res = await apiPaginated<Raw>('institution/master/units', { page: 1, per_page: 200, institution_id: institutionId });
  const data = res.data
    .filter((u) => !u.institution_id || u.institution_id === institutionId)
    .map((u) => ({ id: String(u.id), name: String(u.name ?? u.code ?? u.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  unitOptionCache.set(institutionId, { at: Date.now(), data });
  return data;
}

/** Forget the cached unit options (tests). */
export function resetUnitOptionsCache() {
  unitOptionCache.clear();
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

  const [units, students, activities, candidates, unitOptions, statuses] = await Promise.all([
    total('institution/master/units', inst),
    total(STUDENTS, inst),
    total('academic/student/campaign/student-activities', inst),
    total('academic/candidate/master/candidates', inst),
    loadInstitutionUnitOptions(institutionId).catch(() => []),
    apiPaginated<Raw>('academic/student/reference/statuses', { page: 1, per_page: 100 }).then((r) => r.data).catch(() => []),
  ]);

  /** Students per study program and per status, from the API's own totals (a page of one row each). */
  const byUnit = await inBatches(unitOptions.slice(0, 60), 10, async (u) => ({ name: u.name, value: (await total(STUDENTS, { ...inst, unit_id: u.id })) ?? 0 }));
  const byStatus = await inBatches(statuses, 10, async (st) => ({ name: String(st.name ?? st.code ?? ''), value: (await total(STUDENTS, { ...inst, status_id: st.id })) ?? 0 }));
  const top = (rows: { name: string; value: number }[]) => rows.filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  return { units, students, activities, candidates, studentsByUnit: top(byUnit), studentsByStatus: top(byStatus) };
}

/** Unit types that are study programs (the old dashboard counted only these, not offices or institutes). */
export const isStudyProgram = (typeName: unknown) => /program studi|prodi|jurusan|department|study program/i.test(String(typeName ?? ''));

export interface Program {
  id: string;
  name: string;
  code: string;
  education: string;
  parent: string;
  active: boolean;
}

/** The institution's study programs, A-Z. */
export async function loadInstitutionPrograms(institutionId: string): Promise<Program[]> {
  const res = await apiPaginated<Raw>('institution/master/units', { page: 1, per_page: 200, institution_id: institutionId, with_relations: 'true' });
  return res.data
    .filter((u) => (!u.institution_id || u.institution_id === institutionId) && isStudyProgram(u.unit_type?.name))
    .map((u) => ({
      id: String(u.id),
      name: String(u.name ?? u.code ?? u.id),
      code: String(u.code ?? ''),
      education: String(u.education?.name ?? ''),
      parent: String(u.parent?.name ?? ''),
      active: u.is_active !== false,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A short-lived cache of the programs' dashboards: building the institution view needs one call per
 * program (and the selected program's detail needs the same one again). Keyed by the caller's role
 * too, so nobody is served a dashboard fetched under someone else's permissions. Failures are not cached.
 */
const DASH_TTL_MS = 5 * 60_000;
const dashCache = new Map<string, { at: number; data: Raw | null }>();

/**
 * One program's dashboard. `data` is null when the API has none for it ("Unit not found": a program
 * without curriculum or students yet, which is normal and cached); `failed` is true for real errors
 * (access denied, server errors), which are never cached.
 */
async function cachedDashboard(scope: string, unitId: string): Promise<{ data: Raw | null; failed: boolean }> {
  const key = `${scope}:${unitId}`;
  const hit = dashCache.get(key);
  if (hit && Date.now() - hit.at < DASH_TTL_MS) return { data: hit.data, failed: false };
  try {
    const data = await loadUnitDashboard(unitId);
    dashCache.set(key, { at: Date.now(), data });
    if (dashCache.size > 500) dashCache.delete(dashCache.keys().next().value as string);
    return { data, failed: false };
  } catch (e) {
    if ((e as Error).message === 'Unit not found') {
      dashCache.set(key, { at: Date.now(), data: null });
      return { data: null, failed: false };
    }
    console.warn(`[institution] dashboard of unit ${unitId} unavailable: ${(e as Error).message}`);
    return { data: null, failed: true };
  }
}

/** The full dashboard of one of the institution's study programs (inline detail panel). */
export async function loadInstitutionProgram(institutionId: string, scope: string, rawUnitId: string) {
  const programs = await loadInstitutionPrograms(institutionId);
  const unit = rawUnitId ? programs.find((p) => p.id === rawUnitId) : programs[0];
  if (!unit) throw markSafeError(new Error('Unit not found'));
  const { data } = await cachedDashboard(scope, unit.id);
  if (!data) throw markSafeError(new Error('Unit not found'));
  return data;
}

const lastPositive = (values: number[]) => values.filter((v) => v > 0).at(-1) ?? null;

/**
 * The executive view of the institution: every study program's own dashboard rolled up into totals,
 * trends and distributions, plus one row per program for the comparison charts and table. A program
 * whose dashboard cannot be read still gets a row (marked not loaded) and is counted in `failed`.
 */
export async function loadInstitutionAnalytics(institutionId: string, scope: string) {
  const programs = await loadInstitutionPrograms(institutionId);
  const rows = await inBatches(programs, 5, async (p) => {
    const [{ data: d, failed }, headcount] = await Promise.all([
      cachedDashboard(scope, p.id),
      apiPaginated<Raw>('academic/student/master/students', { page: 1, per_page: 1, institution_id: institutionId, unit_id: p.id }).then((r) => r.pagination.total_data).catch(() => 0),
    ]);
    return { p, d, headcount, failed };
  });
  const ok = rows.filter((r): r is { p: Program; d: Raw; headcount: number; failed: boolean } => r.d !== null);
  const lines = (key: string) => ok.map((r) => lineFromOption(r.d[key]));

  const perProgram = rows.map(({ p, d, headcount }) => {
    const sl = d ? trimTrailingEmpty(lineFromOption(d.student_academic_year_chart)) : null;
    const gl = d ? trimTrailingEmpty(lineFromOption(d.average_gpa_trend)) : null;
    const periods = totalsPerCategory(sl).filter((v) => v > 0);
    return {
      ...p,
      loaded: d !== null,
      students: headcount,
      latestStudents: periods.at(-1) ?? 0,
      courses: Number(d?.matakuliah?.total_matakuliah) || 0,
      credits: Number(d?.matakuliah?.total_credit) || 0,
      curricula: Number(d?.total_curriculum) || 0,
      gpa: gl ? lastPositive(gl.series[0]?.values ?? []) : null,
      lecturers: d ? slicesFromOption(d.lecturer_academic_group_distribution).reduce((a, b) => a + b.value, 0) : 0,
    };
  });

  const gpas = perProgram.map((r) => r.gpa).filter((g): g is number => g !== null);
  return {
    institutionName: String(ok.find((r) => r.d.institution?.name)?.d.institution?.name ?? ''),
    failed: rows.filter((r) => r.failed).length,
    totals: {
      programs: perProgram.length,
      active: perProgram.filter((r) => r.active).length,
      students: perProgram.reduce((s, r) => s + r.students, 0),
      courses: perProgram.reduce((s, r) => s + r.courses, 0),
      credits: perProgram.reduce((s, r) => s + r.credits, 0),
      lecturers: perProgram.reduce((s, r) => s + r.lecturers, 0),
      gpa: gpas.length ? gpas.reduce((a, b) => a + b, 0) / gpas.length : null,
    },
    studentTrend: trimTrailingEmpty(sumLines(lines('student_academic_year_chart'))),
    registrantTrend: trimTrailingEmpty(sumLines(lines('registered_student_academic_year_chart'))),
    gpaTrend: withData(trimTrailingEmpty(meanLine(lines('average_gpa_trend'), 'IPK'))),
    lecturerGroups: sumSlices(ok.map((r) => slicesFromOption(r.d.lecturer_academic_group_distribution))),
    lecturerRanks: sumSlices(ok.map((r) => slicesFromOption(r.d.lecturer_academic_rank_distribution))),
    courseCategories: sumSlices(ok.map((r) => slicesFromOption(r.d.course_category_distribution))),
    programs: perProgram.sort((a, b) => b.students - a.students || a.name.localeCompare(b.name)),
  };
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
