// Create / read / update / delete for the study program's courses, curricula and class codes.
// The browser never sends a unit: it is always the caller's own (resolveMyUnit), and every
// record is checked to belong to it before it is shown, changed or deleted.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { loadUnitLecturerOptions, resolveMyUnit, teachUnit } from './unit';
import { prodiRights, type ProdiRight } from '../lib/prodi-rights';
import { RESOURCES, parseResource, type ChildKey, type FieldError, type ResourceKey, type TopKey } from '../lib/crud-schema';
import { asList } from '../lib/student-select';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));

/** Only the study program role may use these; returns the unit it works in. */
export async function requireProdi(auth: AuthState): Promise<string> {
  if (auth.activeRole !== 'course_department') throw fail('Forbidden', 403);
  return resolveMyUnit(auth);
}

/** A single right on top of `requireProdi` (an explicit Staff position lacks delete / lock / staff changes). */
export function requireRight(auth: AuthState, right: ProdiRight): void {
  if (!prodiRights(auth.activeRoleItem)[right]) throw fail('Forbidden', 403);
}

export async function listRecords(key: TopKey, unitId: string, page: number, search: string, pageSize = 20) {
  const res = await apiPaginated<Raw>(RESOURCES[key].path, { page, per_page: pageSize, search, unit_id: unitId }, { searchParam: RESOURCES[key].searchParam });
  return { ...res, data: res.data.filter((r) => !recordUnit(key, r) || recordUnit(key, r) === unitId) };
}

/** Whose record is it: its own unit, or (teaching classes) the unit of its course / class code / activity. */
const recordUnit = (key: TopKey, rec: Raw): string | undefined => (RESOURCES[key].unitless ? teachUnit(rec) : rec.unit_id);

/** A teaching class that is locked or has students cannot be edited / removed. */
function guardTeach(rec: Raw, forDelete: boolean) {
  if (rec.is_lock) throw fail('locked');
  if (forDelete && (Number(rec.enrolled_count) > 0 || (Array.isArray(rec.detail_activities) && rec.detail_activities.length > 0))) throw fail('hasStudents');
}

/** A record of my unit, or "not found" (also for another unit's: indistinguishable on purpose). */
export async function showRecord(key: TopKey, unitId: string, id: string): Promise<Raw> {
  if (!isUuid(id)) throw fail('Not found', 404);
  const raw = await apiFetch<Raw>(`${RESOURCES[key].path}/${enc(id)}`).catch(() => null);
  const rec = (raw?.data ?? raw) as Raw | null;
  if (!rec?.id || recordUnit(key, rec) !== unitId) throw fail('Not found', 404);
  return rec;
}

export type SaveResult = { ok: true; id: string } | { ok: false; errors: Record<string, FieldError> };

export async function saveRecord(auth: AuthState, key: TopKey, id: string | null, input: Raw): Promise<SaveResult> {
  const unitId = await requireProdi(auth);
  if (key === 'staff') requireRight(auth, 'canManageStaff');
  const parsed = parseResource(key, input);
  if (!parsed.ok) return parsed;
  const body: Raw = RESOURCES[key].unitless ? { ...parsed.body } : { ...parsed.body, unit_id: unitId };

  // A class code must hang off an activity of this unit; a curriculum's year/type are plain references.
  if (key === 'classCode') {
    const act = await apiFetch<Raw>(`academic/campaign/transaction/activities/${enc(String(body.activity_id))}`).catch(() => null);
    const a = (act?.data ?? act) as Raw | null;
    if (!a?.id || (a.unit_id && a.unit_id !== unitId)) return { ok: false, errors: { activity_id: 'invalid' } };
  }

  if (key === 'teach') {
    const bad = await badTeachRefs(unitId, body);
    if (bad) return { ok: false, errors: bad };
  }

  if (id) {
    const existing = await showRecord(key, unitId, id);
    if (key === 'teach') guardTeach(existing, false);
    await apiFetch(`${RESOURCES[key].path}/${enc(id)}`, { method: 'PUT', body });
    return { ok: true, id };
  }
  const created = await apiFetch<Raw>(RESOURCES[key].path, { method: 'POST', body });
  const newId = String(((created?.data ?? created) as Raw)?.id ?? '');
  return { ok: true, id: newId };
}

export async function removeRecord(auth: AuthState, key: TopKey, id: string): Promise<void> {
  const unitId = await requireProdi(auth);
  requireRight(auth, key === 'staff' ? 'canManageStaff' : 'canDelete');
  const rec = await showRecord(key, unitId, id);
  if (key === 'teach') guardTeach(rec, true);
  await apiFetch(`${RESOURCES[key].path}/${enc(id)}`, { method: 'DELETE' });
}

/**
 * Step one of the class form's curriculum picker: the unit's curricula (all of them, newest first).
 * Step two (`loadCurriculumEntries`) lists the entries of the one chosen.
 */
async function loadCurriculumChoices(unitId: string): Promise<Option[]> {
  const list = await apiFetch<unknown>('academic/course/master/curriculums', { query: { page: 1, page_size: 100, unit_id: unitId } }).catch(() => []);
  return asList<Raw>(list)
    .filter((c) => c.unit_id === unitId)
    .map((c) => ({ id: String(c.id), name: String(c.name ?? c.id) }));
}

/** The course entries of one curriculum of the unit, labelled "course (semester)"; empty for any other id. */
async function loadCurriculumEntries(unitId: string, curriculumId: string): Promise<Option[]> {
  if (!isUuid(curriculumId)) return [];
  const raw = await apiFetch<Raw>(`academic/course/master/curriculums/${enc(curriculumId)}`).catch(() => null);
  const c = (raw?.data ?? raw) as Raw | null;
  if (!c?.id || c.unit_id !== unitId) return [];
  return asList<Raw>(c.curriculum_details).map((d) => ({
    id: String(d.id),
    name: [d.course?.code, d.course?.name ?? d.name, d.semester?.name ?? d.semester_name ? `(${d.semester?.name ?? d.semester_name})` : ''].filter(Boolean).join(' '),
  }));
}

/** The seven weekdays (general_reference.weekdays), Monday first. */
async function loadWeekdays(): Promise<Option[]> {
  const res = await apiFetch<unknown>('general/reference/weekdays', { query: { page: 1, page_size: 20 } }).catch(() => []);
  return asList<Raw>(res).map((d) => ({ id: String(d.id), name: String(d.name ?? d.english_name ?? d.id) }));
}

/** Rooms the unit may use: its own and the shared ones that belong to no unit (the API filters; re-checked here). */
async function loadUnitRooms(unitId: string): Promise<Option[]> {
  const res = await apiFetch<unknown>('building/master/rooms', { query: { page: 1, page_size: 500, unit_id: unitId, include_shared: true } }).catch(() => []);
  return asList<Raw>(res)
    .filter((r) => !r.unit_id || r.unit_id === unitId)
    .map((r) => ({ id: String(r.id), name: [r.alphabet_code, r.name].filter(Boolean).join(' · ') || String(r.id) }));
}

/** id -> name maps for a schedule list (the rows only hold weekday and room ids). */
export async function loadScheduleNames(unitId: string): Promise<Record<string, Record<string, string>>> {
  const [weekdays, rooms] = await Promise.all([loadWeekdays(), loadUnitRooms(unitId)]);
  const map = (o: Option[]) => Object.fromEntries(o.map((x) => [x.id, x.name]));
  return { weekday: map(weekdays), room: map(rooms) };
}

const exists = (p: Promise<unknown>) => p.then(() => true, () => false);

/** A teaching class may only point at this unit's course, class code, activity and decree. */
async function badTeachRefs(unitId: string, body: Raw): Promise<Record<string, FieldError> | null> {
  const errors: Record<string, FieldError> = {};
  const checks: [string, Promise<boolean>][] = [
    ['course_id', exists(showRecord('course', unitId, String(body.course_id)))],
    ['class_code_id', exists(showRecord('classCode', unitId, String(body.class_code_id)))],
  ];
  if (body.activity_id) checks.push(['activity_id', exists(showRecord('activity', unitId, String(body.activity_id)))]);
  if (body.curriculum_detail_id) {
    checks.push([
      'curriculum_detail_id',
      (async () => {
        const raw = await apiFetch<Raw>(`${RESOURCES.curriculumDetail.path}/${enc(String(body.curriculum_detail_id))}`).catch(() => null);
        const d = (raw?.data ?? raw) as Raw | null;
        return !!d?.curriculum_id && (await exists(showRecord('curriculum', unitId, String(d.curriculum_id))));
      })(),
    ]);
  }
  checks.push([
    'teach_decree_id',
    (async () => {
      const raw = await apiFetch<Raw>(`${RESOURCES.teachDecree.path}/${enc(String(body.teach_decree_id))}`).catch(() => null);
      const d = (raw?.data ?? raw) as Raw | null;
      return !!d?.activity_id && (await exists(showRecord('activity', unitId, String(d.activity_id))));
    })(),
  ]);
  for (const [field, ok] of checks) if (!(await ok)) errors[field] = 'invalid';
  return Object.keys(errors).length > 0 ? errors : null;
}

// ---- Children: records that hang off a course or curriculum of my unit --------------------------

const parentOf = (key: ChildKey) => RESOURCES[key].parent!;

/** The parent (course / curriculum) must be one of my unit's. */
async function ownParent(key: ChildKey, unitId: string, parentId: string): Promise<Raw> {
  return showRecord(parentOf(key).resource, unitId, parentId);
}

/** A child of `parentId` (which is mine), or "not found" (also when it hangs off another parent). */
export async function showChild(key: ChildKey, unitId: string, parentId: string, id: string): Promise<Raw> {
  await ownParent(key, unitId, parentId);
  if (!isUuid(id)) throw fail('Not found', 404);
  const raw = await apiFetch<Raw>(`${RESOURCES[key].path}/${enc(id)}`).catch(() => null);
  const rec = (raw?.data ?? raw) as Raw | null;
  if (!rec?.id || rec[parentOf(key).field] !== parentId) throw fail('Not found', 404);
  return rec;
}

export async function listChildren(key: ChildKey, unitId: string, parentId: string, page: number, pageSize = 50) {
  const parent = await ownParent(key, unitId, parentId);
  const field = parentOf(key).field;
  if (key === 'curriculumDetail') {
    // The list endpoint cannot filter by curriculum; the curriculum itself embeds its details.
    const all = asList<Raw>(parent.curriculum_details);
    const total = all.length;
    const data = all.slice((page - 1) * pageSize, page * pageSize);
    return { data, pagination: { page, per_page: pageSize, total_page: Math.max(1, Math.ceil(total / pageSize)), total_data: total } };
  }
  const res = await apiPaginated<Raw>(RESOURCES[key].path, { page, per_page: pageSize, [field]: parentId });
  return { ...res, data: res.data.filter((r) => r[field] === parentId) };
}

export async function saveChild(auth: AuthState, key: ChildKey, parentId: string, id: string | null, input: Raw): Promise<SaveResult> {
  const unitId = await requireProdi(auth);
  const parent = await ownParent(key, unitId, parentId);
  const parsed = parseResource(key, input);
  if (!parsed.ok) return parsed;
  const { field } = parentOf(key);
  const body: Raw = { ...parsed.body };

  if ((key === 'teachEvaluation' || key === 'teachSchedule') && parent.is_lock) throw fail('locked');
  if (key === 'teachDecree' && body.staff_id) {
    const raw = await apiFetch<Raw>(`${RESOURCES.staff.path}/${enc(String(body.staff_id))}`).catch(() => null);
    const st = (raw?.data ?? raw) as Raw | null;
    if (!st?.id || st.unit_id !== unitId) return { ok: false, errors: { staff_id: 'invalid' } };
  }

  // A course placed in a curriculum must be one of this unit's courses.
  if (key === 'curriculumDetail') {
    const ok = await showRecord('course', unitId, String(body.course_id)).then(() => true, () => false);
    if (!ok) return { ok: false, errors: { course_id: 'invalid' } };
  }

  if (id) {
    await showChild(key, unitId, parentId, id);
    await apiFetch(`${RESOURCES[key].path}/${enc(id)}`, { method: 'PUT', body: { ...body, [field]: parentId } });
    return { ok: true, id };
  }
  const created = await apiFetch<Raw>(RESOURCES[key].path, { method: 'POST', body: { ...body, [field]: parentId } });
  return { ok: true, id: String(((created?.data ?? created) as Raw)?.id ?? '') };
}

export async function removeChild(auth: AuthState, key: ChildKey, parentId: string, id: string): Promise<void> {
  const unitId = await requireProdi(auth);
  requireRight(auth, 'canDelete');
  const parent = await ownParent(key, unitId, parentId);
  if ((key === 'teachEvaluation' || key === 'teachSchedule') && parent.is_lock) throw fail('locked');
  await showChild(key, unitId, parentId, id);
  await apiFetch(`${RESOURCES[key].path}/${enc(id)}`, { method: 'DELETE' });
}

/**
 * Closes (or reopens) a teaching class. While locked: students cannot enroll in it, lecturers cannot
 * save grades, components or attendance for it, and the study program cannot edit it.
 */
export async function setClassLock(auth: AuthState, teachId: string, locked: boolean): Promise<void> {
  const unitId = await requireProdi(auth);
  requireRight(auth, 'canLockClass');
  const rec = await showRecord('teach', unitId, teachId);
  if (Boolean(rec.is_lock) === locked) return;
  await apiFetch(`${RESOURCES.teach.path}/${enc(teachId)}`, { method: 'PUT', body: { is_lock: locked } });
}

export interface Option {
  id: string;
  name: string;
}
const opts = (list: unknown, label: (r: Raw) => string): Option[] =>
  asList<Raw>(list).map((r) => ({ id: String(r.id), name: label(r) || String(r.id) }));
const orEmpty = <T>(p: Promise<T>, fb: T) => p.catch(() => fb);

/** Select options for a form (reference tables the record points to). */
export async function loadFormOptions(key: ResourceKey, unitId: string, search = ''): Promise<Record<string, Option[]>> {
  if (key === 'course') {
    const q = { page: 1, page_size: 100 };
    const [varieties, groups, competences] = await Promise.all([
      orEmpty(apiFetch<unknown>('academic/course/reference/varieties', { query: q }), []),
      orEmpty(apiFetch<unknown>('academic/course/reference/groups', { query: q }), []),
      orEmpty(apiFetch<unknown>('academic/course/reference/competences', { query: q }), []),
    ]);
    const name = (r: Raw) => String(r.name ?? r.code ?? '');
    return { variety_id: opts(varieties, name), group_id: opts(groups, name), competence_id: opts(competences, name) };
  }
  if (key === 'staff') {
    const [employees, positions] = await Promise.all([
      search.trim()
        ? orEmpty(apiFetch<unknown>('institution/master/employees', { query: { page: 1, page_size: 30, name: search.trim() } }), [])
        : Promise.resolve([]),
      orEmpty(apiFetch<unknown>('institution/reference/position-type', { query: { page: 1, page_size: 100 } }), []),
    ]);
    return {
      employee_id: opts(employees, (r) => [r.code, r.name].filter(Boolean).join(' · ')),
      position_type_id: opts(positions, (r) => String(r.name ?? r.code ?? '')),
    };
  }
  if (key === 'teach') {
    const [courses, codes, acts, encounters, scopes, curriculumEntries, curricula] = await Promise.all([
      orEmpty(apiFetch<unknown>('academic/course/master/courses', { query: { page: 1, page_size: 200, unit_id: unitId } }), []),
      orEmpty(apiFetch<unknown>('academic/campaign/transaction/class-codes', { query: { page: 1, page_size: 200, unit_id: unitId } }), []),
      orEmpty(apiFetch<unknown>('academic/campaign/transaction/activities', { query: { page: 1, page_size: 100, unit_id: unitId } }), []),
      orEmpty(apiFetch<unknown>('academic/campaign/reference/encounter-categories', { query: { page: 1, page_size: 100 } }), []),
      orEmpty(apiFetch<unknown>('academic/campaign/reference/scopes', { query: { page: 1, page_size: 100 } }), []),
      loadCurriculumEntries(unitId, search.trim()),
      loadCurriculumChoices(unitId),
    ]);
    const activities = asList<Raw>(acts);
    const decrees = (
      await Promise.all(
        activities.map((a) => orEmpty(apiFetch<unknown>('academic/campaign/transaction/teach-decrees', { query: { page: 1, page_size: 100, activity_id: a.id } }), [])),
      )
    ).flatMap((d, i) => asList<Raw>(d).map((x) => ({ ...x, _activity: activities[i].name ?? activities[i].academic_year?.name })));
    return {
      course_id: opts(courses, (r) => [r.code, r.name].filter(Boolean).join(' · ')),
      class_code_id: opts(codes, (r) => String(r.name ?? r.code ?? '')),
      activity_id: opts(activities, (r) => String(r.name ?? r.academic_year?.name ?? '')),
      teach_decree_id: opts(decrees, (r) => [r.decree_number, r._activity].filter(Boolean).join(' · ')),
      encounter_category_id: opts(encounters, (r) => String(r.name ?? r.code ?? '')),
      scope_id: opts(scopes, (r) => String(r.name ?? r.code ?? '')),
      curriculum_detail_id: curriculumEntries,
      _curricula: curricula,
    };
  }
  if (key === 'teachSchedule') {
    const [weekdays, rooms] = await Promise.all([loadWeekdays(), loadUnitRooms(unitId)]);
    return { weekday_id: weekdays, room_id: rooms };
  }
  if (key === 'teachDecree') {
    const staff = await orEmpty(apiFetch<unknown>('institution/master/staffes', { query: { page: 1, page_size: 200, unit_id: unitId } }), []);
    return { staff_id: opts(staff, (r) => String(r.name ?? r.code ?? '')) };
  }
  if (key === 'teachLecturer') {
    return { lecturer_id: await orEmpty(loadUnitLecturerOptions(unitId), [] as Option[]) };
  }
  if (key === 'teachEvaluation') {
    const types = await orEmpty(apiFetch<unknown>('academic/course/reference/evaluation-types', { query: { page: 1, page_size: 50 } }), []);
    return { evaluation_type_id: opts(types, (r) => String(r.name ?? r.code ?? '')) };
  }
  if (key === 'activity') {
    const years = await orEmpty(apiFetch<unknown>('academic/general/reference/academic-years/options', { method: 'POST', body: { option_last_year: 10 } }), []);
    return { academic_year_id: opts(years, (r) => String(r.name ?? r.code ?? '')) };
  }
  if (key === 'grade') return {};
  if (key === 'curriculum') {
    const [years, types] = await Promise.all([
      orEmpty(apiFetch<unknown>('academic/general/reference/academic-years/options', { method: 'POST', body: { option_last_year: 10 } }), []),
      orEmpty(apiFetch<unknown>('academic/course/reference/curriculum-types/options', { method: 'POST', body: {} }), []),
    ]);
    const name = (r: Raw) => String(r.name ?? r.code ?? '');
    return { academic_year_id: opts(years, name), curriculum_type_id: opts(types, name) };
  }
  if (key === 'curriculumDetail') {
    const [semesters, courses, concentrations] = await Promise.all([
      orEmpty(apiFetch<unknown>('academic/course/reference/semesters/options', { method: 'POST', body: {} }), []),
      orEmpty(apiFetch<unknown>('academic/course/master/courses', { query: { page: 1, page_size: 200, unit_id: unitId } }), []),
      orEmpty(apiFetch<unknown>('academic/course/master/concentrations/options', { method: 'POST', body: { unit_id: unitId } }), []),
    ]);
    const name = (r: Raw) => String(r.name ?? r.code ?? '');
    return {
      semester_id: opts(semesters, name),
      course_id: opts(courses, (r) => [r.code, r.name].filter(Boolean).join(' · ')),
      concentration_id: opts(concentrations, name),
    };
  }
  if (key === 'evaluationPlanning') {
    const types = await orEmpty(apiFetch<unknown>('academic/course/reference/evaluation-types', { query: { page: 1, page_size: 50 } }), []);
    return { evaluation_type_id: opts(types, (r) => String(r.name ?? r.code ?? '')) };
  }
  if (key === 'learnPlanning') return {};
  const acts = await orEmpty(apiFetch<unknown>('academic/campaign/transaction/activities', { query: { page: 1, page_size: 100, unit_id: unitId } }), []);
  return { activity_id: opts(acts, (r) => String(r.name ?? r.academic_year?.name ?? r.academic_year_name ?? r.semester_name ?? '')) };
}
