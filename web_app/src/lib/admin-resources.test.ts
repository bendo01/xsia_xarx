import { describe, expect, it } from 'vitest';

import { adEn } from '../i18n/locales/administrator.en';
import { adId } from '../i18n/locales/administrator.id';
import { ADMIN_RESOURCES, adminUrl, findAdminResourceByKey, matchAdminPath, optionApi, parseAdminForm } from './admin-resources';

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
    expect(matchAdminPath(`institution/master/unit/${ID}`)).toMatchObject({ view: 'show', id: ID });
    expect(matchAdminPath('academic/student/reference/status/x/create')).toBeNull();
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

describe('academic reference tables', () => {
  it('keeps the old client urls and the API endpoints', () => {
    expect(matchAdminPath('academic/campaign/reference/attend-type')).toMatchObject({ resource: { api: 'academic/campaign/reference/attend-types' } });
    expect(matchAdminPath('academic/student/final-assignment/reference/stage')).toMatchObject({ resource: { api: 'academic/student/final-assignment/reference/stages' } });
    expect(matchAdminPath('academic/student/reference/status')).toMatchObject({ resource: { key: 'academic-student-status' } });
  });
  it('uses the model shape: optional codes, effective dates and extra fields', () => {
    const sem = findAdminResourceByKey('academic-course-semester')!;
    expect(parseAdminForm(sem, { name: 'Ganjil', is_odd: true })).toMatchObject({ ok: true, body: { code: null, alphabet_code: null, is_odd: true } });
    expect(parseAdminForm(sem, { name: 'X', start_effective_date: '2025-02-01', end_effective_date: '2025-01-01' })).toMatchObject({ ok: false, errors: { end_effective_date: 'dateOrder' } });
    const cat = findAdminResourceByKey('academic-campaign-scope')!;
    expect(parseAdminForm(cat, { name: 'N' })).toMatchObject({ ok: false, errors: { code: 'required', alphabet_code: 'required' } });
  });
  it('every select field names an option source', () => {
    for (const r of ADMIN_RESOURCES) for (const f of r.fields) if (f.input === 'select') expect(f.options).toBeTruthy();
  });
});

describe('registry completeness', () => {
  it('every select resolves to a list endpoint', () => {
    for (const r of ADMIN_RESOURCES) for (const f of r.fields) if (f.input === 'select') expect(optionApi(f.options!), `${r.key}.${f.name} -> ${f.options}`).toBeTruthy();
  });
  it('every ad.* label and title has a translation in both languages', () => {
    const missing = new Set<string>();
    for (const r of ADMIN_RESOURCES) {
      const keys = [r.titleKey, ...(r.group ?? []), ...r.columns.map((c) => c.label), ...r.fields.map((f) => f.label)];
      for (const k of keys) if (k.startsWith('ad.') && !(k.slice(3) in adEn && k.slice(3) in adId)) missing.add(k.slice(3));
    }
    expect([...missing].sort()).toEqual([]);
  });
});

describe('lookup fields', () => {
  it('name an option source that resolves, and student/candidate are editable', () => {
    for (const r of ADMIN_RESOURCES) for (const f of r.fields) if (f.input === 'lookup') expect(optionApi(f.options!), `${r.key}.${f.name}`).toBeTruthy();
    expect(findAdminResourceByKey('academic-student-master-student')!.readOnly).toBe(false);
    expect(findAdminResourceByKey('academic-candidate-master-candidate')!.readOnly).toBe(false);
  });
});

describe('location resources', () => {
  it('keeps the old urls and wires the candidate school regency to a picker', () => {
    expect(matchAdminPath('location/regency')).toMatchObject({ resource: { api: 'regencies' } });
    expect(matchAdminPath('location/sub-district/create')).toMatchObject({ view: 'create' });
    const school = findAdminResourceByKey('academic-candidate-master-candidate')!.fields.find((f) => f.name === 'school_regency_id');
    expect(school).toMatchObject({ input: 'lookup', options: 'location-regency' });
    expect(optionApi('location-regency')).toBe('regencies');
  });
  it('requires a province and type for a regency', () => {
    const r = parseAdminForm(findAdminResourceByKey('location-regency')!, { name: 'Kota X' });
    expect(r).toMatchObject({ ok: false, errors: { province_id: 'required', regency_type_id: 'required' } });
  });
});

describe('person, contact, auth', () => {
  it('registers the person references on their singular endpoints and the secured user resource', () => {
    expect(matchAdminPath('person/reference/gender')).toMatchObject({ resource: { api: 'person/reference/gender' } });
    expect(matchAdminPath('auth/user/create')).toBeNull();
    expect(matchAdminPath(`auth/user/${ID}/edit`)).toMatchObject({ view: 'edit' });
    const user = findAdminResourceByKey('auth-user')!;
    expect(user.fields.map((f) => f.name)).toEqual(['name', 'email', 'individual_id', 'is_active']);
  });
  it('never registers a secret as a form field', () => {
    for (const r of ADMIN_RESOURCES) for (const f of r.fields) expect(f.name, `${r.key}.${f.name}`).not.toMatch(/password|api_key|token/i);
  });
});
