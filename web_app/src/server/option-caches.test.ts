import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
});

const U1 = '11111111-1111-4111-8111-111111111111';
const U2 = '22222222-2222-4222-8222-222222222222';
const counts = { units: 0, activities: 0 };
let failActivities = false;

vi.mock('./api', () => ({
  apiFetch: vi.fn(async (path: string) => {
    if (path === 'academic/campaign/transaction/activities') {
      counts.activities += 1;
      if (failActivities) throw new Error('down');
      return [{ id: 'a1', name: '2024/2025 Ganjil' }];
    }
    throw new Error(`unexpected ${path}`);
  }),
  apiPaginated: vi.fn(async (path: string) => {
    if (path === 'institution/master/units') {
      counts.units += 1;
      return { data: [{ id: U2, name: 'Gizi', institution_id: 'i1' }, { id: U1, name: 'Akuntansi', institution_id: 'i1' }, { id: '33333333-3333-4333-8333-333333333333', name: 'Lain', institution_id: 'other' }], pagination: { page: 1, per_page: 200, total_page: 1, total_data: 3 } };
    }
    throw new Error(`unexpected ${path}`);
  }),
}));

import { loadInstitutionUnitOptions, resetUnitOptionsCache, resolveInstitutionUnit } from './institution';
import { loadUnitActivityOptions, resetActivityOptionsCache } from './unit';

describe('unit options of the institution', () => {
  beforeEach(() => {
    counts.units = 0;
    resetUnitOptionsCache();
  });

  it('asks the API once per institution, sorted, and only for its own units', async () => {
    const a = await loadInstitutionUnitOptions('i1');
    const b = await loadInstitutionUnitOptions('i1');
    expect(a.map((u) => u.name)).toEqual(['Akuntansi', 'Gizi']);
    expect(b).toBe(a);
    expect(counts.units).toBe(1);
    await loadInstitutionUnitOptions('i2');
    expect(counts.units).toBe(2);
  });

  it('resolving the chosen unit reuses the cached list and still rejects foreign units', async () => {
    await resolveInstitutionUnit('i1', '');
    await expect(resolveInstitutionUnit('i1', '33333333-3333-4333-8333-333333333333')).rejects.toThrow('Unit not found'); // another institution's unit
    expect((await resolveInstitutionUnit('i1', U1)).unitId).toBe(U1);
    expect((await resolveInstitutionUnit('i1', '')).unitId).toBe(U1); // none chosen: the first, A-Z
    expect(counts.units).toBe(1);
  });
});

describe('activity options of a unit', () => {
  beforeEach(() => {
    counts.activities = 0;
    failActivities = false;
    resetActivityOptionsCache();
  });

  it('asks the API once per unit', async () => {
    const a = await loadUnitActivityOptions('u1');
    expect(await loadUnitActivityOptions('u1')).toBe(a);
    expect(counts.activities).toBe(1);
    await loadUnitActivityOptions('u2');
    expect(counts.activities).toBe(2);
  });

  it('does not keep a failure', async () => {
    failActivities = true;
    expect(await loadUnitActivityOptions('u1')).toEqual([]);
    failActivities = false;
    expect(await loadUnitActivityOptions('u1')).toHaveLength(1);
    expect(counts.activities).toBe(2);
  });
});
