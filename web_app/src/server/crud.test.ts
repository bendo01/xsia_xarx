import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
});

type Call = { path: string; method: string; body?: any; query?: Record<string, unknown> };
let calls: Call[] = [];
let routes: Record<string, (c: Call) => unknown> = {};

vi.mock('./api', () => ({
  apiFetch: vi.fn(async (path: string, opts: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}) => {
    const call: Call = { path, method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'), body: opts.body, query: opts.query };
    calls.push(call);
    const h = routes[`${call.method} ${path}`] ?? routes[path];
    if (!h) throw Object.assign(new Error('not found'), { status: 404 });
    return h(call);
  }),
  apiPaginated: vi.fn(async (path: string, q: Record<string, unknown> = {}, opts: { searchParam?: string } = {}) => {
    calls.push({ path: `LIST ${path}`, method: 'GET', body: { q, opts } });
    const h = routes[`LIST ${path}`];
    return h ? h({ path, method: 'GET', body: { q, opts } }) : { data: [], pagination: { page: 1, per_page: 10, total_page: 1, total_data: 0 } };
  }),
}));

import type { AuthState } from './auth';
import { loadFaList } from './final-assignment';
import { assertCanSeeLecturer } from './lecturer';
import { isUnitLecturer, loadUnitLecturerOptions, loadUnitLecturers, loadUnitTeach, resolveMyUnit, teachUnit } from './unit';
import { listChildren, loadFormOptions, loadScheduleNames, removeChild, setClassLock, removeRecord, requireProdi, saveChild, saveRecord, showChild, showRecord } from './crud';

const id = (n: number) => `123e4567-e89b-42d3-a456-4266141740${String(n).padStart(2, '0')}`;
const MINE = id(1), OTHER = id(2), REC = id(3), VARIETY = id(4), ACT = id(5), YEAR = id(6), TYPE = id(7);
const auth = (over: Partial<AuthState> = {}): AuthState => ({
  authenticated: true, activeRole: 'course_department', roles: [], activeRoleId: null,
  activeRoleItem: { id: 'r', name: 'Kepala Program Studi', unit_id: MINE } as any,
  user: { id: 'u', name: 'K', email: 'k@x', individual_id: id(9) }, ...over,
});
const course = { code: 'IF1', name: 'Algo', total_credit: '3', lecture_credit: '2', practice_credit: '1', field_practice_credit: '0', simulation_credit: '0', variety_id: VARIETY };
const writes = () => calls.filter((c) => c.method !== 'GET');

beforeEach(() => {
  calls = [];
  routes = {
    [`academic/course/master/courses/${REC}`]: () => ({ id: REC, unit_id: MINE, name: 'Algo' }),
    [`POST academic/course/master/courses`]: () => ({ id: REC }),
    [`PUT academic/course/master/courses/${REC}`]: () => ({}),
    [`DELETE academic/course/master/courses/${REC}`]: () => ({}),
  };
});

describe('study program CRUD (server)', () => {
  it('is only for the course-department role', async () => {
    await expect(requireProdi(auth({ activeRole: 'student' }))).rejects.toThrow('Forbidden');
    await expect(saveRecord(auth({ activeRole: 'lecturer' }), 'course', null, course)).rejects.toThrow('Forbidden');
    expect(calls).toEqual([]);
  });

  it('returns field errors without calling the API', async () => {
    const r = await saveRecord(auth(), 'course', null, { ...course, code: '' });
    expect(r).toEqual({ ok: false, errors: { code: 'required' } });
    expect(writes()).toEqual([]);
  });

  it("creates with the caller's own unit, ignoring one sent by the browser", async () => {
    const r = await saveRecord(auth(), 'course', null, { ...course, unit_id: OTHER });
    expect(r).toEqual({ ok: true, id: REC });
    expect(writes()).toHaveLength(1);
    expect(writes()[0].body.unit_id).toBe(MINE);
  });

  it("refuses to edit or delete another unit's record, and does not say it exists", async () => {
    routes[`academic/course/master/courses/${REC}`] = () => ({ id: REC, unit_id: OTHER });
    await expect(saveRecord(auth(), 'course', REC, course)).rejects.toThrow('Not found');
    await expect(removeRecord(auth(), 'course', REC)).rejects.toThrow('Not found');
    await expect(showRecord('course', MINE, REC)).rejects.toThrow('Not found');
    expect(writes()).toEqual([]);
  });

  it('rejects a malformed id before touching the API', async () => {
    await expect(removeRecord(auth(), 'course', '../x')).rejects.toThrow('Not found');
    expect(calls).toEqual([]);
  });

  it('updates and deletes its own record', async () => {
    expect(await saveRecord(auth(), 'course', REC, course)).toEqual({ ok: true, id: REC });
    await removeRecord(auth(), 'course', REC);
    expect(writes().map((c) => c.method)).toEqual(['PUT', 'DELETE']);
  });

  it("a class code must belong to an activity of the caller's unit", async () => {
    routes[`academic/campaign/transaction/activities/${ACT}`] = () => ({ id: ACT, unit_id: OTHER });
    const input = { name: 'A', activity_id: ACT };
    expect(await saveRecord(auth(), 'classCode', null, input)).toEqual({ ok: false, errors: { activity_id: 'invalid' } });
    expect(writes()).toEqual([]);

    routes[`academic/campaign/transaction/activities/${ACT}`] = () => ({ id: ACT, unit_id: MINE });
    routes['POST academic/campaign/transaction/class-codes'] = () => ({ id: REC });
    expect(await saveRecord(auth(), 'classCode', null, input)).toEqual({ ok: true, id: REC });
  });

  it('curriculum create sends the unit and the parsed fields only', async () => {
    routes['POST academic/course/master/curriculums'] = () => ({ id: REC });
    await saveRecord(auth(), 'curriculum', null, { name: 'K', academic_year_id: YEAR, curriculum_type_id: TYPE, evil: 1 });
    expect(writes()[0].body).toMatchObject({ name: 'K', unit_id: MINE, is_active: false });
    expect(writes()[0].body).not.toHaveProperty('evil');
  });
});

describe('children of a course / curriculum (server)', () => {
  const CUR = id(11), DET = id(12), PLAN = id(13), EVT = id(14), COURSE2 = id(15);
  beforeEach(() => {
    routes[`academic/course/master/curriculums/${CUR}`] = () => ({
      id: CUR, unit_id: MINE, name: 'K', curriculum_details: [{ id: DET, course: { code: 'IF1' } }, { id: id(16) }],
    });
    routes[`academic/course/master/course-evaluation-plannings/${PLAN}`] = () => ({ id: PLAN, course_id: REC });
    routes['POST academic/course/master/course-evaluation-plannings'] = () => ({ id: PLAN });
    routes[`PUT academic/course/master/course-evaluation-plannings/${PLAN}`] = () => ({});
    routes[`DELETE academic/course/master/course-evaluation-plannings/${PLAN}`] = () => ({});
    routes['POST academic/course/master/curriculum-details'] = () => ({ id: DET });
    routes[`academic/course/master/courses/${COURSE2}`] = () => ({ id: COURSE2, unit_id: OTHER });
  });
  const evalInput = { name: 'UTS', evaluation_type_id: EVT, decription_indonesian: 'x', course_id: COURSE2 };

  it('creates under my course and takes the course from the route, not the form', async () => {
    expect(await saveChild(auth(), 'evaluationPlanning', REC, null, evalInput)).toEqual({ ok: true, id: PLAN });
    expect(writes()[0].body).toMatchObject({ name: 'UTS', course_id: REC });
  });

  it("refuses children of another unit's course", async () => {
    routes[`academic/course/master/courses/${REC}`] = () => ({ id: REC, unit_id: OTHER });
    await expect(saveChild(auth(), 'evaluationPlanning', REC, null, evalInput)).rejects.toThrow('Not found');
    expect(writes()).toEqual([]);
  });

  it('does not touch a child that belongs to a different parent', async () => {
    routes[`academic/course/master/course-evaluation-plannings/${PLAN}`] = () => ({ id: PLAN, course_id: COURSE2 });
    await expect(showChild('evaluationPlanning', MINE, REC, PLAN)).rejects.toThrow('Not found');
    await expect(removeChild(auth(), 'evaluationPlanning', REC, PLAN)).rejects.toThrow('Not found');
    expect(writes()).toEqual([]);
  });

  it('updates and deletes its own child', async () => {
    expect(await saveChild(auth(), 'evaluationPlanning', REC, PLAN, evalInput)).toEqual({ ok: true, id: PLAN });
    await removeChild(auth(), 'evaluationPlanning', REC, PLAN);
    expect(writes().map((c) => c.method)).toEqual(['PUT', 'DELETE']);
  });

  it("a curriculum can only hold the unit's own courses", async () => {
    const input = { course_id: COURSE2, semester_id: id(17) };
    expect(await saveChild(auth(), 'curriculumDetail', CUR, null, input)).toEqual({ ok: false, errors: { course_id: 'invalid' } });
    expect(writes()).toEqual([]);
    expect(await saveChild(auth(), 'curriculumDetail', CUR, null, { ...input, course_id: REC })).toEqual({ ok: true, id: DET });
    expect(writes()[0].body).toMatchObject({ curriculum_id: CUR, course_id: REC });
  });

  it("lists a curriculum's courses from the curriculum itself, with paging", async () => {
    const r = await listChildren('curriculumDetail', MINE, CUR, 1, 1);
    expect(r.data).toHaveLength(1);
    expect(r.pagination).toMatchObject({ total_data: 2, total_page: 2 });
  });
});

describe('unit scoping helpers', () => {
  const TEACH = id(21), STAFF = id(22);
  it("shows a teaching class only when its course / class code / activity is the unit's", async () => {
    routes[`academic/campaign/transaction/teaches/${TEACH}`] = () => ({ id: TEACH, course: { unit_id: MINE } });
    expect((await loadUnitTeach(MINE, TEACH)).id).toBe(TEACH);
    routes[`academic/campaign/transaction/teaches/${TEACH}`] = () => ({ id: TEACH, course: { unit_id: OTHER } });
    await expect(loadUnitTeach(MINE, TEACH)).rejects.toThrow('Not found');
    routes[`academic/campaign/transaction/teaches/${TEACH}`] = () => ({ id: TEACH });
    await expect(loadUnitTeach(MINE, TEACH)).rejects.toThrow('Not found'); // cannot tell whose it is
    await expect(loadUnitTeach(MINE, 'nope')).rejects.toThrow('Not found');
  });
  it('knows whose class it is from the first available relation', () => {
    expect(teachUnit({ class_code: { unit_id: 'a' }, activity: { unit_id: 'b' } })).toBe('a');
    expect(teachUnit({})).toBeUndefined();
  });
  it("resolves a staff member's unit through the staff record behind the role", async () => {
    routes[`institution/master/staffes/${STAFF}`] = () => ({ id: STAFF, unit_id: MINE });
    const a = auth({ activeRoleItem: { id: 'r', name: 'Staff Program Studi', roleable_id: STAFF, roleable_type: 'Staff' } as any });
    expect(await resolveMyUnit(a)).toBe(MINE);
  });
  it("falls back to the person's employee/staff records, then gives up", async () => {
    const ind = id(9);
    routes[`person/master/individual/${ind}`] = () => ({ employees: [{ staffes: [{ unit_id: MINE }] }] });
    const a = auth({ activeRoleItem: { id: 'r', name: 'Staff Program Studi' } as any });
    expect(await resolveMyUnit(a)).toBe(MINE);
    routes[`person/master/individual/${ind}`] = () => ({ employees: [] });
    await expect(resolveMyUnit(a)).rejects.toThrow('Unit not found');
  });
});

describe('teaching classes, decrees, lecturers and evaluations (server)', () => {
  const T = id(31), CODE = id(32), DECREE = id(33), STAFF = id(34), LEC = id(35), EV = id(36), ACT2 = id(37);
  const teachInput = { course_id: REC, class_code_id: CODE, activity_id: ACT, teach_decree_id: DECREE, name: 'A' };
  beforeEach(() => {
    routes[`academic/campaign/transaction/class-codes/${CODE}`] = () => ({ id: CODE, unit_id: MINE });
    routes[`academic/campaign/transaction/activities/${ACT}`] = () => ({ id: ACT, unit_id: MINE });
    routes[`academic/campaign/transaction/teach-decrees/${DECREE}`] = () => ({ id: DECREE, activity_id: ACT });
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, enrolled_count: 0, is_lock: false });
    routes['POST academic/campaign/transaction/teaches'] = () => ({ id: T });
    routes[`PUT academic/campaign/transaction/teaches/${T}`] = () => ({});
    routes[`DELETE academic/campaign/transaction/teaches/${T}`] = () => ({});
    routes[`institution/master/staffes/${STAFF}`] = () => ({ id: STAFF, unit_id: MINE });
    routes['POST academic/campaign/transaction/teach-decrees'] = () => ({ id: DECREE });
    routes['POST academic/campaign/transaction/teach-evaluations'] = () => ({ id: EV });
    routes[`DELETE academic/campaign/transaction/teach-evaluations/${EV}`] = () => ({});
    routes[`academic/campaign/transaction/teach-evaluations/${EV}`] = () => ({ id: EV, teach_id: T });
    routes['POST academic/campaign/transaction/teach-lecturers'] = () => ({ id: LEC });
  });

  it('creates a class without sending a unit, after checking every reference belongs to the unit', async () => {
    expect(await saveRecord(auth(), 'teach', null, teachInput)).toEqual({ ok: true, id: T });
    expect(writes()[0].body).not.toHaveProperty('unit_id');
    expect(writes()[0].body).toMatchObject({ course_id: REC, class_code_id: CODE, teach_decree_id: DECREE });
  });

  it('flags a course, class code, activity or decree of another unit', async () => {
    routes[`academic/course/master/courses/${REC}`] = () => ({ id: REC, unit_id: OTHER });
    routes[`academic/campaign/transaction/class-codes/${CODE}`] = () => ({ id: CODE, unit_id: OTHER });
    routes[`academic/campaign/transaction/teach-decrees/${DECREE}`] = () => ({ id: DECREE, activity_id: ACT2 });
    routes[`academic/campaign/transaction/activities/${ACT2}`] = () => ({ id: ACT2, unit_id: OTHER });
    const r = await saveRecord(auth(), 'teach', null, teachInput);
    expect(r).toEqual({ ok: false, errors: { course_id: 'invalid', class_code_id: 'invalid', teach_decree_id: 'invalid' } });
    expect(writes()).toEqual([]);
  });

  it("refuses another unit's class, a locked class, and deleting a class that has students", async () => {
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: OTHER } });
    await expect(saveRecord(auth(), 'teach', T, teachInput)).rejects.toThrow('Not found');
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: true });
    await expect(saveRecord(auth(), 'teach', T, teachInput)).rejects.toThrow('locked');
    await expect(removeRecord(auth(), 'teach', T)).rejects.toThrow('locked');
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, enrolled_count: 3 });
    await expect(removeRecord(auth(), 'teach', T)).rejects.toThrow('hasStudents');
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, class_code: { unit_id: MINE }, detail_activities: [{ id: 'x' }] });
    await expect(removeRecord(auth(), 'teach', T)).rejects.toThrow('hasStudents');
    expect(writes()).toEqual([]);
  });

  it('deletes an empty, unlocked class', async () => {
    await removeRecord(auth(), 'teach', T);
    expect(writes().map((c) => c.method)).toEqual(['DELETE']);
  });

  it("a decree hangs off the unit's activity; its signer must be the unit's staff", async () => {
    const input = { decree_number: 'SK/1', decree_date: '2024-01-02', staff_id: STAFF };
    expect(await saveChild(auth(), 'teachDecree', ACT, null, input)).toEqual({ ok: true, id: DECREE });
    expect(writes()[0].body).toMatchObject({ activity_id: ACT, decree_number: 'SK/1' });
    routes[`institution/master/staffes/${STAFF}`] = () => ({ id: STAFF, unit_id: OTHER });
    expect(await saveChild(auth(), 'teachDecree', ACT, null, input)).toEqual({ ok: false, errors: { staff_id: 'invalid' } });
  });

  it("class lecturers and evaluations belong to the unit's class; evaluations freeze when it is locked", async () => {
    const lec = { lecturer_id: LEC, planning: '16', realization: '0' };
    expect(await saveChild(auth(), 'teachLecturer', T, null, lec)).toEqual({ ok: true, id: LEC });
    expect(writes()[0].body).toMatchObject({ teach_id: T, planning: 16 });

    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: true });
    await expect(saveChild(auth(), 'teachEvaluation', T, null, { name: 'UTS' })).rejects.toThrow('locked');
    await expect(removeChild(auth(), 'teachEvaluation', T, EV)).rejects.toThrow('locked');

    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: OTHER } });
    await expect(saveChild(auth(), 'teachLecturer', T, null, lec)).rejects.toThrow('Not found');
  });
});

describe("the unit's lecturers (via homebases) and who may open a lecturer", () => {
  const L1 = id(41), L2 = id(42), L3 = id(43);
  const page = (data: unknown[]) => ({ data, pagination: { page: 1, per_page: 20, total_page: 1, total_data: data.length } });
  beforeEach(() => {
    routes['LIST academic/lecturer/transaction/homebases'] = (c) => {
      const q = c.body.q as Record<string, unknown>;
      const all = [
        { lecturer_id: L1, unit_id: MINE, lecturer: { id: L1, code: 'D1', name: 'Dewi', group: { name: 'III/a' } }, status_name: 'Aktif' },
        { lecturer_id: L1, unit_id: MINE, lecturer_name: 'Dewi' }, // older homebase row of the same lecturer
        { lecturer_id: L2, unit_id: OTHER, lecturer_name: 'Other unit' },
        { lecturer_id: L3, unit_id: MINE, lecturer_name: 'Budi', contract_name: 'Tetap' },
      ];
      return page(q.lecturer_id ? all.filter((h) => h.lecturer_id === q.lecturer_id) : all);
    };
  });

  it('lists one row per lecturer of the unit, searching with the `search` parameter', async () => {
    const r = await loadUnitLecturers(MINE, 1, 'dew');
    expect(r.data.map((l) => [l.id, l.name])).toEqual([[L1, 'Dewi'], [L3, 'Budi']]);
    expect(r.data[0]).toMatchObject({ code: 'D1', group_name: 'III/a', status_name: 'Aktif' });
    expect(r.data[1]).toMatchObject({ contract_name: 'Tetap' });
    const call = calls.find((c) => c.path.startsWith('LIST'))!;
    expect(call.body.opts).toEqual({ searchParam: 'search' });
    expect(call.body.q).toMatchObject({ unit_id: MINE, search: 'dew' });
  });

  it('offers the unit lecturers as select options', async () => {
    expect((await loadUnitLecturerOptions(MINE)).map((o) => o.id)).toEqual([L1, L3]);
  });

  it('knows whether a lecturer is homebased in the unit', async () => {
    expect(await isUnitLecturer(MINE, L1)).toBe(true);
    expect(await isUnitLecturer(MINE, L2)).toBe(false); // their only homebase is another unit's
    expect(await isUnitLecturer(MINE, 'nope')).toBe(false);
  });

  it('study program: only its own lecturers; administrators any; lecturers only themselves; students never', async () => {
    await expect(assertCanSeeLecturer(auth(), L1)).resolves.toBeUndefined();
    await expect(assertCanSeeLecturer(auth(), L2)).rejects.toThrow('Lecturer not found');
    await expect(assertCanSeeLecturer(auth({ activeRole: 'administrator' }), L2)).resolves.toBeUndefined();
    const lec = auth({ activeRole: 'lecturer', activeRoleItem: { id: 'r', name: 'Dosen', roleable_id: L1 } as any });
    await expect(assertCanSeeLecturer(lec, L1)).resolves.toBeUndefined();
    await expect(assertCanSeeLecturer(lec, L3)).rejects.toThrow('Lecturer not found');
    await expect(assertCanSeeLecturer(auth({ activeRole: 'student' }), L1)).rejects.toThrow('Lecturer not found');
  });
});

describe('teaching class: curriculum entry', () => {
  const T = id(51), CODE = id(52), DECREE = id(53), ACT = id(54), CD = id(55), CUR = id(56);
  const input = { course_id: REC, class_code_id: CODE, activity_id: ACT, teach_decree_id: DECREE, curriculum_detail_id: CD, is_lecturer_credit_sum_problem: 'on' };
  beforeEach(() => {
    routes[`academic/campaign/transaction/class-codes/${CODE}`] = () => ({ id: CODE, unit_id: MINE });
    routes[`academic/campaign/transaction/activities/${ACT}`] = () => ({ id: ACT, unit_id: MINE });
    routes[`academic/campaign/transaction/teach-decrees/${DECREE}`] = () => ({ id: DECREE, activity_id: ACT });
    routes['POST academic/campaign/transaction/teaches'] = () => ({ id: T });
    routes[`academic/course/master/curriculum-details/${CD}`] = () => ({ id: CD, curriculum_id: CUR });
    routes[`academic/course/master/curriculums/${CUR}`] = () => ({ id: CUR, unit_id: MINE });
  });
  it("accepts an entry of the unit's own curriculum and sends the new fields", async () => {
    expect(await saveRecord(auth(), 'teach', null, input)).toEqual({ ok: true, id: T });
    expect(writes()[0].body).toMatchObject({ curriculum_detail_id: CD, is_lecturer_credit_sum_problem: true, encounter_category_id: null, scope_id: null });
  });
  it("rejects an entry of another unit's curriculum", async () => {
    routes[`academic/course/master/curriculums/${CUR}`] = () => ({ id: CUR, unit_id: OTHER });
    expect(await saveRecord(auth(), 'teach', null, input)).toEqual({ ok: false, errors: { curriculum_detail_id: 'invalid' } });
    expect(writes()).toEqual([]);
  });
});

describe('class lock (server)', () => {
  const T = id(61);
  beforeEach(() => {
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: false });
    routes[`PUT academic/campaign/transaction/teaches/${T}`] = () => ({});
  });
  it('locks and unlocks a class of the unit, sending only the flag', async () => {
    await setClassLock(auth(), T, true);
    expect(writes()).toHaveLength(1);
    expect(writes()[0]).toMatchObject({ method: 'PUT', body: { is_lock: true } });
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: true });
    calls = [];
    await setClassLock(auth(), T, false);
    expect(writes()[0].body).toEqual({ is_lock: false });
  });
  it('does nothing when the class is already in that state', async () => {
    await setClassLock(auth(), T, false);
    expect(writes()).toEqual([]);
  });
  it("is only for the unit's own classes and the study program role", async () => {
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: OTHER } });
    await expect(setClassLock(auth(), T, true)).rejects.toThrow('Not found');
    await expect(setClassLock(auth({ activeRole: 'lecturer' }), T, true)).rejects.toThrow('Forbidden');
    expect(writes()).toEqual([]);
  });
});

describe('Kepala / Sekretaris / Staff rights (server)', () => {
  const T = id(71), STAFF = id(72), CUR = id(73), DET = id(74);
  const staffRole = (name: string) => auth({ activeRoleItem: { id: 'r', name, unit_id: MINE } as any });
  beforeEach(() => {
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: false });
    routes[`PUT academic/campaign/transaction/teaches/${T}`] = () => ({});
    routes[`institution/master/staffes/${STAFF}`] = () => ({ id: STAFF, unit_id: MINE });
    routes['POST institution/master/staffes'] = () => ({ id: STAFF });
    routes[`DELETE institution/master/staffes/${STAFF}`] = () => ({});
    routes[`DELETE academic/course/master/courses/${REC}`] = () => ({});
    routes[`academic/course/master/curriculums/${CUR}`] = () => ({ id: CUR, unit_id: MINE, curriculum_details: [] });
    routes[`academic/course/master/curriculum-details/${DET}`] = () => ({ id: DET, curriculum_id: CUR });
    routes[`DELETE academic/course/master/curriculum-details/${DET}`] = () => ({});
  });

  it('Staff cannot delete, lock or change staff, and nothing is sent', async () => {
    const staff = staffRole('Staff Program Studi');
    await expect(removeRecord(staff, 'course', REC)).rejects.toThrow('Forbidden');
    await expect(removeChild(staff, 'curriculumDetail', CUR, DET)).rejects.toThrow('Forbidden');
    await expect(setClassLock(staff, T, true)).rejects.toThrow('Forbidden');
    await expect(saveRecord(staff, 'staff', null, { employee_id: id(75) })).rejects.toThrow('Forbidden');
    await expect(removeRecord(staff, 'staff', STAFF)).rejects.toThrow('Forbidden');
    expect(writes()).toEqual([]);
  });

  it('Staff can still create and edit everything else', async () => {
    const staff = staffRole('Staff Program Studi');
    expect(await saveRecord(staff, 'course', REC, course)).toEqual({ ok: true, id: REC });
    expect(writes().map((c) => c.method)).toEqual(['PUT']);
  });

  it('Kepala, Sekretaris and other prodi roles keep every right', async () => {
    for (const name of ['Kepala Program Studi', 'Sekretaris Program Studi', 'Kajur']) {
      calls = [];
      const a = staffRole(name);
      await removeRecord(a, 'course', REC);
      await setClassLock(a, T, true);
      expect(await saveRecord(a, 'staff', null, { employee_id: id(75) })).toEqual({ ok: true, id: STAFF });
      expect(writes().map((c) => c.method)).toEqual(['DELETE', 'PUT', 'POST']);
    }
  });
});

describe('teaching class form: two-step curriculum picker', () => {
  const CUR = id(81), CUR2 = id(82), E1 = id(83), E2 = id(84);
  beforeEach(() => {
    routes['academic/course/master/curriculums'] = () => ({ data: [{ id: CUR, name: 'K2020', unit_id: MINE }, { id: CUR2, name: 'Other', unit_id: OTHER }] });
    routes[`academic/course/master/curriculums/${CUR}`] = () => ({ id: CUR, unit_id: MINE, curriculum_details: [{ id: E1, course: { code: 'IF1', name: 'Algo' }, semester: { name: 'Smt 1' } }, { id: E2, name: 'Basis Data' }] });
    routes[`academic/course/master/curriculums/${CUR2}`] = () => ({ id: CUR2, unit_id: OTHER, curriculum_details: [{ id: id(85), name: 'Secret' }] });
  });
  it("offers the unit's curricula and, once one is chosen, only its entries", async () => {
    const none = await loadFormOptions('teach', MINE);
    expect(none._curricula).toEqual([{ id: CUR, name: 'K2020' }]); // another unit's curriculum is not offered
    expect(none.curriculum_detail_id).toEqual([]);

    const chosen = await loadFormOptions('teach', MINE, CUR);
    expect(chosen.curriculum_detail_id).toEqual([
      { id: E1, name: 'IF1 Algo (Smt 1)' },
      { id: E2, name: 'Basis Data' },
    ]);
  });
  it("never lists the entries of another unit's curriculum or a junk id", async () => {
    expect((await loadFormOptions('teach', MINE, CUR2)).curriculum_detail_id).toEqual([]);
    expect((await loadFormOptions('teach', MINE, 'nope')).curriculum_detail_id).toEqual([]);
  });
});

describe('adviser / final-assignment lists (server)', () => {
  const S1 = id(91), L1 = id(92), D1 = id(93), S2 = id(94);
  const page = (data: unknown[]) => ({ data, pagination: { page: 1, per_page: 20, total_page: 1, total_data: data.length } });
  it('sends no unit (the API scopes the rows) and resolves ids to names, tolerating failed lookups', async () => {
    routes['LIST academic/student/adviser/counsellors'] = () => page([
      { id: 'c1', student_id: S1, lecturer_id: L1, decree_id: D1 },
      { id: 'c2', student_id: S2, lecturer_id: L1, decree_id: D1 }, // S2 cannot be looked up
    ]);
    routes[`academic/student/master/students/${S1}`] = () => ({ id: S1, code: '2020', name: 'Budi' });
    routes[`academic/lecturer/master/lecturers/${L1}`] = () => ({ id: L1, code: 'D1', name: 'Dewi' });
    routes[`academic/student/adviser/decrees/${D1}`] = () => ({ id: D1, decree_number: 'SK/1' });
    const r = await loadFaList('counsellor', 2);
    const listCall = calls.find((c) => c.path === 'LIST academic/student/adviser/counsellors')!;
    expect(listCall.body.q).toEqual({ page: 2, per_page: 20 });
    expect(r.names).toEqual({ student: { [S1]: '2020 · Budi' }, lecturer: { [L1]: 'D1 · Dewi' }, adviserDecree: { [D1]: 'SK/1' } });
    // each distinct id is fetched once, even when several rows share it
    expect(calls.filter((c) => c.path === `academic/lecturer/master/lecturers/${L1}`)).toHaveLength(1);
  });
});

describe('teaching class schedule (server)', () => {
  const T = id(11), WD = id(12), RM = id(13), RM2 = id(14), SCH = id(15);
  const input = { weekday_id: WD, room_id: RM, start_hour: '08:00', end_hour: '09:40' };
  beforeEach(() => {
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: false });
    routes['POST academic/campaign/transaction/schedules'] = () => ({ id: SCH });
    routes[`academic/campaign/transaction/schedules/${SCH}`] = () => ({ id: SCH, teach_id: T });
    routes[`DELETE academic/campaign/transaction/schedules/${SCH}`] = () => ({});
    routes['general/reference/weekdays'] = () => ({ data: [{ id: WD, code: 1, name: 'Senin' }] });
    routes['building/master/rooms'] = () => ({ data: [{ id: RM, name: 'Lab 1', alphabet_code: 'L1', unit_id: MINE }, { id: RM2, name: 'Other', unit_id: OTHER }, { id: id(16), name: 'Shared' }] });
  });

  it('creates a schedule under the unit\'s class, with seconds on the times and the class from the route', async () => {
    expect(await saveChild(auth(), 'teachSchedule', T, null, { ...input, teach_id: id(17) })).toEqual({ ok: true, id: SCH });
    expect(writes()[0].body).toMatchObject({ teach_id: T, weekday_id: WD, room_id: RM, start_hour: '08:00:00', end_hour: '09:40:00' });
  });

  it('refuses a bad time range without calling the API', async () => {
    expect(await saveChild(auth(), 'teachSchedule', T, null, { ...input, end_hour: '08:00' })).toEqual({ ok: false, errors: { end_hour: 'timeOrder' } });
    expect(await saveChild(auth(), 'teachSchedule', T, null, { ...input, start_hour: '25:00' })).toEqual({ ok: false, errors: { start_hour: 'invalid' } });
    expect(writes()).toEqual([]);
  });

  it('freezes schedules while the class is locked', async () => {
    routes[`academic/campaign/transaction/teaches/${T}`] = () => ({ id: T, course: { unit_id: MINE }, is_lock: true });
    await expect(saveChild(auth(), 'teachSchedule', T, null, input)).rejects.toThrow('locked');
    await expect(removeChild(auth(), 'teachSchedule', T, SCH)).rejects.toThrow('locked');
    expect(writes()).toEqual([]);
  });

  it("offers the weekdays and only the unit's (and shared) rooms", async () => {
    const o = await loadFormOptions('teachSchedule', MINE);
    const roomCall = calls.find((c) => c.path === 'building/master/rooms')!;
    expect(roomCall.query).toMatchObject({ unit_id: MINE, include_shared: true }); // the API does the unit filtering now
    expect(o.weekday_id).toEqual([{ id: WD, name: 'Senin' }]);
    expect(o.room_id.map((r) => r.name)).toEqual(['L1 · Lab 1', 'Shared']);
    const names = await loadScheduleNames(MINE);
    expect(names.weekday[WD]).toBe('Senin');
    expect(names.room[RM2]).toBeUndefined();
  });
});
