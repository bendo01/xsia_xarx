import { describe, expect, it } from 'vitest';

import { listAdminRecords, loadAdminForm, loadAdminRecord, redact, removeAdminRecord, saveAdminRecord, searchOptions } from './admin-crud';
import type { AuthState } from './auth';

const ID = '11111111-1111-4111-8111-111111111111';
const as = (activeRole: string) => ({ activeRole }) as AuthState;

describe('admin crud guards', () => {
  it('rejects every non-administrator role before touching the API', async () => {
    for (const role of ['rectorat', 'student', 'lecturer', 'course_department', 'guest']) {
      await expect(listAdminRecords(as(role), 'unit', 1, '', 20)).rejects.toThrow('Forbidden');
      await expect(loadAdminForm(as(role), 'unit', '')).rejects.toThrow('Forbidden');
      await expect(saveAdminRecord(as(role), 'unit', null, {})).rejects.toThrow('Forbidden');
      await expect(removeAdminRecord(as(role), 'unit', ID)).rejects.toThrow('Forbidden');
    }
  });
  it('rejects unknown resources and bad ids for an administrator', async () => {
    await expect(listAdminRecords(as('administrator'), 'nope', 1, '', 20)).rejects.toThrow('Not found');
    await expect(loadAdminForm(as('administrator'), 'unit', 'not-a-uuid')).rejects.toThrow('Not found');
    await expect(removeAdminRecord(as('administrator'), 'unit', 'x')).rejects.toThrow('Not found');
  });
  it('returns field errors without calling the API when the form is invalid', async () => {
    const res = await saveAdminRecord(as('administrator'), 'unit', null, { name: '' });
    expect(res).toMatchObject({ ok: false, errors: { name: 'required' } });
  });
});

describe('searchOptions', () => {
  it('is administrator-only and limited to the resource\'s own lookup sources', async () => {
    await expect(searchOptions(as('rectorat'), 'staff', 'employee', 'x')).rejects.toThrow('Forbidden');
    await expect(searchOptions(as('administrator'), 'staff', 'user', 'x')).rejects.toThrow('Not found');
    await expect(searchOptions(as('administrator'), 'staff', 'employee', '  ')).resolves.toEqual([]);
  });
});

describe('loadAdminRecord', () => {
  it('is administrator-only and rejects unknown resources and bad ids', async () => {
    await expect(loadAdminRecord(as('student'), 'unit', ID)).rejects.toThrow('Forbidden');
    await expect(loadAdminRecord(as('administrator'), 'nope', ID)).rejects.toThrow('Not found');
    await expect(loadAdminRecord(as('administrator'), 'unit', 'x')).rejects.toThrow('Not found');
  });
});

describe('redact', () => {
  it('drops password hashes, api keys and one-time tokens but keeps the data', () => {
    const row = { id: ID, name: 'A', email: 'a@x.id', password: 'hash', api_key: 'k', reset_token: 't', email_verification_token: 'v', magic_link_token: 'm', magic_link_expiration: 'd', is_active: true };
    expect(redact(row)).toEqual({ id: ID, name: 'A', email: 'a@x.id', is_active: true });
  });
  it('refuses to create users here', async () => {
    await expect(saveAdminRecord(as('administrator'), 'auth-user', null, { name: 'x', email: 'x@y.id' })).rejects.toThrow('Not found');
  });
});
