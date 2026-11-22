import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { listFeeder, loadFeederForm, loadFeederRecord, removeFeederRecord, saveFeederRecord } from './feeder-admin';

const ID = '11111111-1111-4111-8111-111111111111';
const as = (activeRole: string) => ({ activeRole }) as AuthState;
const admin = as('administrator');

describe('feeder admin guards', () => {
  it('is administrator-only', async () => {
    await expect(listFeeder(as('rectorat'), 'master', 'mahasiswa', 1, 20)).rejects.toThrow('Forbidden');
    await expect(loadFeederRecord(as('student'), 'master', 'mahasiswa', ID)).rejects.toThrow('Forbidden');
    await expect(loadFeederForm(as('lecturer'), 'agama', '')).rejects.toThrow('Forbidden');
    await expect(saveFeederRecord(as('rectorat'), 'agama', null, {})).rejects.toThrow('Forbidden');
    await expect(removeFeederRecord(as('rectorat'), 'agama', ID)).rejects.toThrow('Forbidden');
  });
  it('only reads unknown tables and bad ids as not found', async () => {
    await expect(listFeeder(admin, 'master', 'nope', 1, 20)).rejects.toThrow('Not found');
    await expect(loadFeederRecord(admin, 'master', 'mahasiswa', 'x')).rejects.toThrow('Not found');
  });
  it('writes only to reference tables', async () => {
    await expect(loadFeederForm(admin, 'nope', '')).rejects.toThrow('Not found');
    await expect(removeFeederRecord(admin, 'mahasiswa', ID)).rejects.toThrow('Not found');
    await expect(saveFeederRecord(admin, 'agama', ID.replace('1', 'g'), {})).rejects.toThrow('Not found');
  });
});
