// Study-program (unit) reads for the course-department role (Kepala / Staff Program Studi).
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { asList } from '../lib/student-select';
import { resolveUnitId } from '../lib/unit-select';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;

/**
 * The unit this signed-in user works in. A real UUID in the URL is taken as is (the API's data
 * scope decides what they may see); a placeholder is resolved from the active role, then from the
 * staff record behind the role, then from the person's employee/staff records.
 */
export async function resolveMyUnit(auth: AuthState, raw = ''): Promise<string> {
  const direct = resolveUnitId(raw, auth.activeRoleItem);
  if (direct) return direct;

  const staffId = auth.activeRoleItem?.roleable_id;
  if (staffId && isUuid(staffId)) {
    const staff = await apiFetch<Raw>(`institution/master/staffes/${enc(staffId)}`).catch(() => null);
    const unit = ((staff?.data ?? staff) as Raw | null)?.unit_id;
    if (typeof unit === 'string' && isUuid(unit)) return unit;
  }

  const ind = auth.user?.individual_id;
  if (ind && isUuid(ind)) {
    const person = await apiFetch<Raw>(`person/master/individual/${enc(ind)}`).catch(() => null);
    const body = ((person?.data ?? person) as Raw | null) ?? {};
    for (const emp of asList<Raw>(body.employees)) {
      for (const st of asList<Raw>(emp.staffes)) {
        if (typeof st.unit_id === 'string' && isUuid(st.unit_id)) return st.unit_id;
      }
    }
  }
  throw markSafeError(new Error('Unit not found'));
}

/** The unit dashboard body (identity, totals and the ready-made chart options). */
export async function loadUnitDashboard(unitId: string): Promise<Raw> {
  const raw = await apiFetch<Raw>(`institution/master/units/${enc(unitId)}/dashboard`);
  const body = (raw.data ?? raw) as Raw;
  if (!body || !body.id) throw markSafeError(new Error('Unit not found'));
  return body;
}

export interface StudentFilter {
  page: number;
  search: string;
  yearId: string;
  statusId: string;
  sort: string;
}

const SORTS: Record<string, [string, string]> = {
  'code-asc': ['code', 'asc'],
  'code-desc': ['code', 'desc'],
  'name-asc': ['name', 'asc'],
  'name-desc': ['name', 'desc'],
};

/** One page of the unit's students, with the search / year / status filters applied by the API. */
export async function loadUnitStudents(unitId: string, f: StudentFilter, pageSize = 20) {
  const [sort_by, sort_dir] = SORTS[f.sort] ?? SORTS['code-asc'];
  return apiPaginated<Raw>('academic/student/master/students', {
    page: f.page,
    per_page: pageSize,
    search: f.search,
    unit_id: unitId,
    academic_year_id: isUuid(f.yearId) ? f.yearId : undefined,
    status_id: isUuid(f.statusId) ? f.statusId : undefined,
    sort_by,
    sort_dir,
  }, { searchParam: 'search' });
}

export async function loadStudentFilters(unitId: string) {
  const [years, statuses] = await Promise.all([
    apiFetch<unknown>('academic/student/master/students/academic-years', { query: { unit_id: unitId } }).catch(() => []),
    apiFetch<unknown>('academic/student/reference/statuses', { query: { page: 1, page_size: 100 } }).catch(() => []),
  ]);
  const pick = (r: Raw) => ({ id: String(r.id), name: String(r.name ?? r.code ?? '') });
  return { years: asList<Raw>(years).map(pick), statuses: asList<Raw>(statuses).map(pick) };
}

export interface ActivityFilter {
  page: number;
  search: string;
  yearId: string;
  sort: string;
}

const ACT_SORTS: Record<string, [string, string]> = {
  'student_name-asc': ['student_name', 'asc'],
  'student_name-desc': ['student_name', 'desc'],
  'student_code-asc': ['student_code', 'asc'],
  'student_code-desc': ['student_code', 'desc'],
};

/** One page of semester activities of the unit's students. Rows of other units never get through. */
export async function loadUnitActivities(unitId: string, f: ActivityFilter, pageSize = 20) {
  const [sort_by, sort_dir] = ACT_SORTS[f.sort] ?? ACT_SORTS['student_code-asc'];
  const res = await apiPaginated<Raw>('academic/student/campaign/student-activities', {
    page: f.page,
    per_page: pageSize,
    search: f.search,
    unit_id: unitId,
    academic_year_id: isUuid(f.yearId) ? f.yearId : undefined,
    sort_by,
    sort_dir,
  }, { searchParam: 'search' });
  return { ...res, data: res.data.filter((a) => !a.unit_id || a.unit_id === unitId) };
}

export async function loadAcademicYearOptions() {
  const res = await apiFetch<unknown>('academic/general/reference/academic-years/options', { method: 'POST', body: {} }).catch(() => []);
  return asList<Raw>(res).map((r) => ({ id: String(r.id), name: String(r.name ?? r.code ?? '') }));
}

/**
 * Lecturers whose homebase is the unit. The lecturer list endpoint cannot filter by unit, so this
 * reads the homebase records (which can) and turns each into a lecturer row, one per lecturer.
 */
export async function loadUnitLecturers(unitId: string, page: number, search: string, pageSize = 20) {
  const res = await apiPaginated<Raw>('academic/lecturer/transaction/homebases', { page, per_page: pageSize, search, unit_id: unitId }, { searchParam: 'search' });
  const seen = new Set<string>();
  const data: Raw[] = [];
  for (const h of res.data) {
    if (h.unit_id && h.unit_id !== unitId) continue;
    const id = String(h.lecturer_id ?? h.lecturer?.id ?? '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const l = (h.lecturer ?? {}) as Raw;
    data.push({
      id,
      name: l.name ?? h.lecturer_name ?? l.individual?.name ?? null,
      code: l.code ?? null,
      nidn: l.nidn ?? null,
      front_title: l.front_title ?? null,
      last_title: l.last_title ?? null,
      group_name: l.group?.name ?? l.group_name ?? null,
      status_name: h.status_name ?? h.status?.name ?? l.status?.name ?? null,
      contract_name: h.contract_name ?? h.contract?.name ?? l.contract?.name ?? null,
    });
  }
  return { ...res, data };
}

/** The unit's lecturers as select options (de-duplicated, up to 200). */
export async function loadUnitLecturerOptions(unitId: string) {
  const res = await apiPaginated<Raw>('academic/lecturer/transaction/homebases', { page: 1, per_page: 200, unit_id: unitId });
  const seen = new Map<string, string>();
  for (const h of res.data) {
    const id = String(h.lecturer_id ?? '');
    if (!id || seen.has(id) || (h.unit_id && h.unit_id !== unitId)) continue;
    const l = (h.lecturer ?? {}) as Raw;
    seen.set(id, [l.code, l.name ?? h.lecturer_name].filter(Boolean).join(' · ') || id);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

/** Is this lecturer homebased in the unit (so the study program may see their record)? */
export async function isUnitLecturer(unitId: string, lecturerId: string): Promise<boolean> {
  if (!isUuid(lecturerId)) return false;
  const res = await apiPaginated<Raw>('academic/lecturer/transaction/homebases', { page: 1, per_page: 5, unit_id: unitId, lecturer_id: lecturerId });
  return res.data.some((h) => h.lecturer_id === lecturerId && (!h.unit_id || h.unit_id === unitId));
}

/** A student of this unit (by student id) and its owner's individual id, for the profile page. */
export async function loadUnitStudent(unitId: string, studentId: string): Promise<{ id: string; individual_id: string }> {
  if (!isUuid(studentId)) throw markSafeError(new Error('Student not found'));
  const raw = await apiFetch<Raw>(`academic/student/master/students/${enc(studentId)}`);
  const s = (raw.data ?? raw) as Raw;
  if (!s?.id || (s.unit_id && s.unit_id !== unitId) || !isUuid(String(s.individual_id ?? ''))) {
    throw markSafeError(new Error('Student not found'));
  }
  return { id: String(s.id), individual_id: String(s.individual_id) };
}

// ---- Teaching classes and staff (read-only) -------------------------------------------------

export interface TeachFilter {
  page: number;
  search: string;
  activityId: string;
  lock: string;
}

/** Whose class is this: the unit of its course, class code or activity (any one is enough). */
export const teachUnit = (t: Raw): string | undefined => t.course?.unit_id || t.class_code?.unit_id || t.activity?.unit_id || t.unit_id;

/** One page of the unit's teaching classes; course / class names are looked up when the list omits them. */
export async function loadUnitTeaches(unitId: string, f: TeachFilter, pageSize = 20) {
  const res = await apiPaginated<Raw>('academic/campaign/transaction/teaches', {
    page: f.page,
    per_page: pageSize,
    search: f.search,
    unit_id: unitId,
    activity_id: isUuid(f.activityId) ? f.activityId : undefined,
  });
  let rows = res.data.filter((t) => !teachUnit(t) || teachUnit(t) === unitId);
  if (f.lock === 'locked') rows = rows.filter((t) => t.is_lock);
  if (f.lock === 'unlocked') rows = rows.filter((t) => !t.is_lock);

  if (rows.some((t) => !t.course || !t.class_code)) {
    const [courses, codes] = await Promise.all([
      apiFetch<unknown>('academic/course/master/courses', { query: { page: 1, page_size: 500, unit_id: unitId } }).catch(() => []),
      apiFetch<unknown>('academic/campaign/transaction/class-codes', { query: { page: 1, page_size: 500, unit_id: unitId } }).catch(() => []),
    ]);
    const cm = new Map(asList<Raw>(courses).map((c) => [c.id, c]));
    const km = new Map(asList<Raw>(codes).map((c) => [c.id, c]));
    rows = rows.map((t) => ({ ...t, course: t.course ?? cm.get(t.course_id), class_code: t.class_code ?? km.get(t.class_code_id) }));
  }
  const activities = await loadUnitActivityOptions(unitId);
  return { ...res, data: rows, activities };
}

export async function loadUnitActivityOptions(unitId: string) {
  const res = await apiFetch<unknown>('academic/campaign/transaction/activities', { query: { page: 1, page_size: 100, unit_id: unitId } }).catch(() => []);
  return asList<Raw>(res).map((a) => ({ id: String(a.id), name: String(a.name ?? a.academic_year?.name ?? a.id) }));
}

/** A teaching class of my unit with its lecturers, students and evaluation components. */
export async function loadUnitTeach(unitId: string, teachId: string): Promise<Raw> {
  if (!isUuid(teachId)) throw markSafeError(new Error('Not found'));
  const raw = await apiFetch<Raw>(`academic/campaign/transaction/teaches/${enc(teachId)}`).catch(() => null);
  const t = (raw?.data ?? raw) as Raw | null;
  if (!t?.id || teachUnit(t) !== unitId) throw markSafeError(new Error('Not found'));
  return t;
}

/** The unit's staff (name, position, decree, period). */
export async function loadUnitStaff(unitId: string, page: number, search: string, pageSize = 20) {
  const res = await apiPaginated<Raw>('institution/master/staffes', { page, per_page: pageSize, search, unit_id: unitId });
  return { ...res, data: res.data.filter((s) => !s.unit_id || s.unit_id === unitId) };
}
