import { describe, expect, it } from 'vitest';

import { ADMIN_RESOURCES, adminUrl, findAdminResourceByKey, matchAdminPath, parseAdminForm } from './admin-resources';

const ID = '11111111-1111-4111-8111-111111111111';

describe('matchAdminPath', () => {
  it('maps list, create and edit urls', () => {
    expect(matchAdminPath('institution/master/unit')).toMatchObject({ view: 'list', resource: { key: 'unit' } });
    expect(matchAdminPath('institution/master/unit/create')).toMatchObject({ view: 'create' });
    expect(matchAdminPath(`institution/reference/position-type/${ID}/edit`)).toMatchObject({ view: 'edit', id: ID, resource: { key: 'position-type' } });
  });
  it('ignores slashes and rejects unknown or malformed paths', () => {
    expect(matchAdminPath('/institution/master/staff/')).toMatchObject({ view: 'list', resource: { key: 'staff' } });
    expect(matchAdminPath('institution/master/nope')).toBeNull();
    expect(matchAdminPath(`institution/master/unit/${ID}`)).toBeNull();
    expect(matchAdminPath(`institution/master/unit/${ID}/delete`)).toBeNull();
  });
});

describe('registry', () => {
  it('has unique keys and paths, and every column is a field or a known display field', () => {
    expect(new Set(ADMIN_RESOURCES.map((r) => r.key)).size).toBe(ADMIN_RESOURCES.length);
    expect(new Set(ADMIN_RESOURCES.map((r) => r.path)).size).toBe(ADMIN_RESOURCES.length);
    for (const r of ADMIN_RESOURCES) {
      for (const f of r.fields) if (f.input === 'select') expect(f.options, `${r.key}.${f.name}`).toBeTruthy();
    }
  });
  it('builds urls', () => {
    expect(adminUrl(findAdminResourceByKey('unit')!, 'create')).toBe('/administrator/institution/master/unit/create');
  });
});

describe('parseAdminForm', () => {
  const unit = findAdminResourceByKey('unit')!;
  it('requires the unit relations and nulls blank optional ones', () => {
    const bad = parseAdminForm(unit, { name: 'A', code: '1' });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(['education_id', 'institution_id', 'unit_type_id']);
    const ok = parseAdminForm(unit, { name: 'A', code: '1', institution_id: ID, unit_type_id: ID, education_id: ID, parent_id: '', is_active: true });
    expect(ok).toMatchObject({ ok: true, body: { parent_id: null, feeder_id: null, is_active: true } });
  });
  it('coerces the integer code of a reference table', () => {
    const cat = findAdminResourceByKey('category')!;
    expect(parseAdminForm(cat, { code: '7', alphabet_code: 'A', name: 'N' })).toMatchObject({ ok: true, body: { code: 7 } });
    expect(parseAdminForm(cat, { code: 'x', alphabet_code: 'A', name: 'N' })).toMatchObject({ ok: false });
  });
  it('rejects a staff end date before its start date', () => {
    const staff = findAdminResourceByKey('staff')!;
    const r = parseAdminForm(staff, { employee_id: ID, unit_id: ID, start_date: '2025-02-01', end_date: '2025-01-01' });
    expect(r).toMatchObject({ ok: false, errors: { end_date: 'dateOrder' } });
  });
});
