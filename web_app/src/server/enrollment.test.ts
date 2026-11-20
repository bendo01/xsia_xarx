import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
});

// A fake Rust API: path -> JSON, with a call log so tests can assert on writes.
type Call = { path: string; method: string; body?: any; query?: Record<string, unknown> };
let calls: Call[] = [];
let routes: Record<string, (c: Call) => unknown> = {};

vi.mock('./api', () => ({
  apiFetch: vi.fn(async (path: string, opts: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}) => {
    const call: Call = { path, method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'), body: opts.body, query: opts.query };
    calls.push(call);
    const handler = routes[`${call.method} ${path}`] ?? routes[path];
    if (!handler) throw Object.assign(new Error('not found'), { status: 404 });
    return handler(call);
  }),
  apiPaginated: vi.fn(),
}));

import { dropFromPlan, enrollInClass, loadActivityDetail, loadEnrollment, loadOwnActivity, loadRealtimeChannels } from './enrollment';
import type { AuthState } from './auth';

const id = (n: number) => `123e4567-e89b-42d3-a456-4266141740${String(n).padStart(2, '0')}`;
const ACT = id(1), STU = id(2), T1 = id(11), T2 = id(12), T3 = id(13), C1 = id(21), C2 = id(22), C3 = id(23), D1 = id(31), UNIT = id(41);

const auth = (over: Partial<AuthState> = {}): AuthState => ({
  authenticated: true, activeRole: 'student', roles: [], activeRoleId: null, activeRoleItem: null,
  user: { id: 'u', name: 'Budi', email: 'b@x', individual_id: 'ind-1' }, ...over,
});

function backend(opts: { locked?: boolean; owner?: string; enrolled?: object[]; teaches?: object[] } = {}) {
  const enrolled = opts.enrolled ?? [];
  routes = {
    [`academic/student/campaign/student-activities/${ACT}`]: () => ({ id: ACT, student_id: STU, unit_activity_id: 'ua', is_lock: opts.locked ?? false, cumulative_index: 3.5, grand_cumulative_index: 3.4 }),
    [`academic/student/master/students/${STU}`]: () => ({ id: STU, individual_id: opts.owner ?? 'ind-1', unit_id: UNIT }),
    'academic/campaign/transaction/activities/ua': () => ({ id: 'ua', unit_id: UNIT }),
    'academic/campaign/transaction/teaches': () => ({
      data: opts.teaches ?? [
        { id: T1, course_id: C1, class_code_id: 'cc', activity_id: 'ua', max_member: 40, enrolled_count: 5 },
        { id: T2, course_id: C2, class_code_id: 'cc', activity_id: 'ua', max_member: 2, enrolled_count: 2 }, // full
        { id: T3, course_id: C3, class_code_id: 'cc', activity_id: 'ua', max_member: 40, enrolled_count: 0 }, // 22 credits
      ],
    }),
    'academic/campaign/transaction/teach-decrees': () => ({ data: [] }),
    'academic/campaign/transaction/class-codes': () => ({ data: [{ id: 'cc', alphabet_code: 'A' }] }),
    'academic/campaign/transaction/teach-lecturers': () => ({ data: [] }),
    'academic/lecturer/master/lecturers': () => ({ data: [] }),
    'academic/campaign/transaction/schedules': () => ({ data: [] }),
    'building/master/rooms': () => ({ data: [] }),
    'academic/course/master/courses': () => ({
      data: [
        { id: C1, code: 'IF1', name: 'Algoritma', total_credit: 3 },
        { id: C2, code: 'IF2', name: 'Basis Data', total_credit: 3 },
        { id: C3, code: 'IF3', name: 'Skripsi Besar', total_credit: 22 },
      ],
    }),
    'academic/student/campaign/detail-activities': (c) =>
      c.method === 'POST' ? { id: 'new' } : { data: enrolled.map((e) => ({ activity_id: ACT, ...e })) },
    [`academic/student/campaign/detail-activities/${D1}`]: () => ({}),
  };
}
const writes = () => calls.filter((c) => c.method !== 'GET');

beforeEach(() => { calls = []; });

describe('loadOwnActivity (ownership)', () => {
  it('returns the activity for its owner', async () => {
    backend();
    expect((await loadOwnActivity(auth(), ACT)).activity.id).toBe(ACT);
  });
  it("reads someone else's activity as NOT_FOUND, not as forbidden", async () => {
    backend({ owner: 'someone-else' });
    await expect(loadOwnActivity(auth(), ACT)).rejects.toThrow('NOT_FOUND');
  });
  it('lets an administrator in', async () => {
    backend({ owner: 'someone-else' });
    await expect(loadOwnActivity(auth({ activeRole: 'administrator' }), ACT)).resolves.toBeTruthy();
  });
  it('rejects ids that are not UUIDs before any request', async () => {
    backend();
    await expect(loadOwnActivity(auth(), '../x')).rejects.toThrow('NOT_FOUND');
    expect(calls).toHaveLength(0);
  });
});

describe('loadEnrollment', () => {
  it('builds offerings with joined course data and seat counts', async () => {
    backend();
    const data = await loadEnrollment(auth(), ACT);
    expect(data.offerings.map((o) => o.course_code).sort()).toEqual(['IF1', 'IF2', 'IF3']);
    expect(data.offerings.find((o) => o.id === T1)).toMatchObject({ credits: 3, class_name: 'A', enrolled_count: 5, max_member: 40 });
  });
});

describe('enrollInClass', () => {
  it('creates the enrolment with the credit taken from the course, never from the caller', async () => {
    backend();
    await enrollInClass(auth(), ACT, T1);
    const [post] = writes();
    expect(post).toMatchObject({ method: 'POST', path: 'academic/student/campaign/detail-activities' });
    expect(post.body).toMatchObject({ course_id: C1, teach_id: T1, activity_id: ACT, credit: 3, name: 'Algoritma' });
  });

  it.each([
    ['a locked semester', { locked: true }, T1, 'LOCKED'],
    ['a full class', {}, T2, 'FULL'],
    ['a class that is not on offer', {}, id(99), 'NOT_OFFERED'],
    ['the same class again', { enrolled: [{ id: D1, teach_id: T1, course_id: C1, credit: 3 }] }, T1, 'ALREADY_ENROLLED'],
    ['the same course in another class', { enrolled: [{ id: D1, teach_id: id(77), course_id: C1, credit: 3 }] }, T1, 'DUPLICATE_COURSE'],
    ['going over the credit cap', { enrolled: [{ id: D1, teach_id: id(78), course_id: id(79), credit: 6 }] }, T3, 'CREDIT_LIMIT'], // 6 + 22 > 24
  ])('refuses %s without writing', async (_name, setup, teachId, code) => {
    backend(setup);
    await expect(enrollInClass(auth(), ACT, teachId)).rejects.toThrow(code);
    expect(writes()).toHaveLength(0);
  });

  it("refuses to touch another person's semester", async () => {
    backend({ owner: 'someone-else' });
    await expect(enrollInClass(auth(), ACT, T1)).rejects.toThrow('NOT_FOUND');
    expect(writes()).toHaveLength(0);
  });

  it('rejects a non-UUID class id', async () => {
    backend();
    await expect(enrollInClass(auth(), ACT, 'x/../y')).rejects.toThrow('NOT_OFFERED');
    expect(calls).toHaveLength(0);
  });
});

describe('dropFromPlan', () => {
  const mine = [{ id: D1, teach_id: T1, course_id: C1, credit: 3 }];

  it('deletes a course on the plan', async () => {
    backend({ enrolled: mine });
    await dropFromPlan(auth(), ACT, D1);
    expect(writes()).toEqual([expect.objectContaining({ method: 'DELETE', path: `academic/student/campaign/detail-activities/${D1}` })]);
  });
  it('refuses while the semester is locked', async () => {
    backend({ enrolled: mine, locked: true });
    await expect(dropFromPlan(auth(), ACT, D1)).rejects.toThrow('LOCKED');
    expect(writes()).toHaveLength(0);
  });
  it('refuses a detail id that is not on this activity', async () => {
    backend({ enrolled: [] });
    await expect(dropFromPlan(auth(), ACT, D1)).rejects.toThrow('NOT_FOUND');
    expect(writes()).toHaveLength(0);
  });
  it("refuses another person's semester", async () => {
    backend({ enrolled: mine, owner: 'someone-else' });
    await expect(dropFromPlan(auth(), ACT, D1)).rejects.toThrow('NOT_FOUND');
    expect(writes()).toHaveLength(0);
  });
});

describe('loadActivityDetail', () => {
  it('looks up missing course and grade by id instead of fetching whole lists', async () => {
    backend({ enrolled: [{ id: D1, course_id: C1, grade_id: id(51), teach_id: T1, credit: 3 }] });
    routes[`academic/course/master/courses/${C1}`] = () => ({ id: C1, code: 'IF1', name: 'Algoritma', total_credit: 3 });
    routes[`academic/campaign/transaction/grades/${id(51)}`] = () => ({ id: id(51), alphabet_code: 'A', grade: 4 });
    routes[`academic/campaign/transaction/teaches/${T1}`] = () => ({ id: T1, class_code_id: 'cc', lecturer_name: 'Dr. Ani' });
    routes[`academic/campaign/transaction/class-codes/cc`] = () => ({ id: 'cc', alphabet_code: 'A' });
    const d = await loadActivityDetail(auth(), ACT);
    expect(d.courses[0]).toMatchObject({ course_code: 'IF1', grade_letter: 'A', grade_point: 4, class_name: 'A' });
    expect(d.courses[0].lecturers).toEqual([{ code: '', name: 'Dr. Ani' }]);
    // no bulk "list everything" calls on the detail path
    expect(calls.some((c) => c.path === 'academic/campaign/transaction/grades' || c.path === 'academic/course/master/courses')).toBe(false);
  });
});

describe('loadRealtimeChannels', () => {
  it('is the activity plus one teach channel per class on offer', async () => {
    backend();
    const channels = await loadRealtimeChannels(auth(), ACT);
    expect(channels[0]).toBe(`activity:${ACT}`);
    expect(channels.slice(1).sort()).toEqual([`teach:${T1}`, `teach:${T2}`, `teach:${T3}`]);
  });
  it('never hands out channels for a semester that is not yours', async () => {
    backend({ owner: 'someone-else' });
    await expect(loadRealtimeChannels(auth(), ACT)).rejects.toThrow('NOT_FOUND');
  });
  it('drops class ids that are not UUIDs', async () => {
    backend({ teaches: [{ id: T1, course_id: C1, class_code_id: 'cc', activity_id: 'ua' }, { id: 'teach:../../x', course_id: C1, class_code_id: 'cc', activity_id: 'ua' }] });
    expect(await loadRealtimeChannels(auth(), ACT)).toEqual([`activity:${ACT}`, `teach:${T1}`]);
  });
});
