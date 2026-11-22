import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
});

let calls = 0;
let failNext = false;

vi.mock('./api', () => ({
  apiFetch: vi.fn(async () => {
    calls += 1;
    if (failNext) throw new Error('down');
    return [{ id: 'y1', name: '2024/2025' }, { id: 'y2', code: '2023/2024' }];
  }),
  apiPaginated: vi.fn(),
}));

import { loadAcademicYearOptions, resetAcademicYearsCache } from './unit';

describe('loadAcademicYearOptions', () => {
  beforeEach(() => {
    calls = 0;
    failNext = false;
    resetAcademicYearsCache();
  });

  it('asks the API once and serves the years from memory afterwards', async () => {
    const first = await loadAcademicYearOptions();
    const second = await loadAcademicYearOptions();
    expect(first).toEqual([{ id: 'y1', name: '2024/2025' }, { id: 'y2', name: '2023/2024' }]);
    expect(second).toBe(first);
    expect(calls).toBe(1);
  });

  it('does not keep a failure: the next call asks again', async () => {
    failNext = true;
    expect(await loadAcademicYearOptions()).toEqual([]);
    failNext = false;
    expect((await loadAcademicYearOptions()).length).toBe(2);
    expect(calls).toBe(2);
  });
});
