import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
});

type Call = { path: string; method: string; body?: any };
let calls: Call[] = [];
let routes: Record<string, (c: Call) => unknown> = {};

vi.mock('./api', () => ({
  apiFetch: vi.fn(async (path: string, opts: { method?: string; body?: unknown } = {}) => {
    const call: Call = { path, method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'), body: opts.body };
    calls.push(call);
    const h = routes[`${call.method} ${path}`] ?? routes[path];
    if (!h) throw Object.assign(new Error('not found'), { status: 404 });
    return h(call);
  }),
  apiPaginated: vi.fn(),
}));

import { assertClassOpen, isClassLocked } from './attendance';
import type { AuthState } from './auth';
import { loadGradeSheet, removeEvaluation, saveEvaluation, saveGradeRows, seedEvaluations } from './grading';

const id = (n: number) => `123e4567-e89b-42d3-a456-4266141740${String(n).padStart(2, '0')}`;
const T = id(1), LEC = id(2), M = id(3), DA = id(4), EV = id(5);
const lecturer: AuthState = {
  authenticated: true, activeRole: 'lecturer', roles: [], activeRoleId: null,
  activeRoleItem: { id: 'r', name: 'Dosen', roleable_id: LEC } as any,
  user: { id: 'u', name: 'D', email: 'd@x', individual_id: id(9) },
};
const writes = () => calls.filter((c) => c.method !== 'GET');

function backend(isLock: boolean) {
  routes = {
    [`academic/campaign/transaction/teaches/lecturer/${LEC}`]: () => [{ teach_id: T, lecturer_id: LEC }],
    [`academic/campaign/transaction/teaches/${T}`]: () => ({
      id: T, name: 'Kelas', is_lock: isLock, unit_id: id(7),
      teach_evaluations: [{ id: EV, name: 'UTS', evaluation_weight: 100, thread: 1 }],
      detail_activities: [{ id: DA, mark: 0, is_lock: false }],
      detail_activity_evaluation_components: [],
    }),
    [`academic/campaign/transaction/teach-meetings`]: () => [{ id: M, teach_id: T, sequence: 1 }],
  };
}

beforeEach(() => {
  calls = [];
});

describe('class lock: lecturer side', () => {
  it('reports the lock on the grade sheet', async () => {
    backend(true);
    expect((await loadGradeSheet(lecturer, T)).classLocked).toBe(true);
    backend(false);
    expect((await loadGradeSheet(lecturer, T)).classLocked).toBe(false);
  });

  it('refuses every grade or component change on a locked class, without writing', async () => {
    backend(true);
    await expect(saveGradeRows(lecturer, T, [{ detail_activity_id: DA, marks: { [EV]: 80 } }])).rejects.toThrow('classLocked');
    await expect(saveEvaluation(lecturer, T, { name: 'Tugas', weight: 10 })).rejects.toThrow('classLocked');
    await expect(removeEvaluation(lecturer, T, EV)).rejects.toThrow('classLocked');
    await expect(seedEvaluations(lecturer, T, { tugas: 'a', kuis: 'b', kehadiranPartisipasi: 'c', uts: 'd', uas: 'e' })).rejects.toThrow('classLocked');
    expect(writes()).toEqual([]);
  });

  it('still saves grades on an open class', async () => {
    backend(false);
    routes[`PUT academic/student/campaign/detail-activities/${DA}`] = () => ({});
    routes['POST academic/student/campaign/detail-activity-evaluation-components'] = () => ({ id: id(6) });
    routes['academic/campaign/transaction/grades/unit/' + id(7)] = () => [];
    const r = await saveGradeRows(lecturer, T, [{ detail_activity_id: DA, marks: { [EV]: 80 } }]);
    expect(r.saved).toEqual([DA]);
  });
});

describe('class lock: attendance', () => {
  it('reports the lock so the page can go read-only (reading is still allowed)', async () => {
    backend(true);
    expect(await isClassLocked(T)).toBe(true);
    backend(false);
    expect(await isClassLocked(T)).toBe(false);
  });
  it('blocks writing attendance when the class is locked', async () => {
    backend(true);
    await expect(assertClassOpen(T, M)).rejects.toThrow('classLocked');
  });
  it('requires the meeting to belong to the class', async () => {
    backend(false);
    await expect(assertClassOpen(T, M)).resolves.toBeUndefined();
    await expect(assertClassOpen(T, id(8))).rejects.toThrow('Meeting not found');
    await expect(assertClassOpen('nope', M)).rejects.toThrow('Invalid teach');
  });
});
