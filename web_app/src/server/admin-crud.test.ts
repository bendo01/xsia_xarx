import { describe, expect, it } from 'vitest';

import { listAdminRecords, loadAdminForm, removeAdminRecord, saveAdminRecord } from './admin-crud';
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
