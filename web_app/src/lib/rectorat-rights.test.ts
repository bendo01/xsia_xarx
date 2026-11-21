import { describe, expect, it } from 'vitest';

import { canManageInstitution } from './rectorat-rights';

const role = (position_type_id?: string) => ({ id: '1', name: 'Rektorat', position_type_id });

describe('canManageInstitution', () => {
  it('allows Rektor, Kepala Biro Administrasi Umum and Kepala Pengembangan TI', () => {
    expect(canManageInstitution(role('e34401db-84ec-450b-bdba-6b9640fc3ae8'))).toBe(true);
    expect(canManageInstitution(role('b92fb48d-53c6-4219-a826-432bdae23ae5'))).toBe(true);
    expect(canManageInstitution(role('d7208431-ba92-4c75-855c-3f8ab651646f'))).toBe(true);
  });
  it('keeps other positions (even a role named Rektorat) read-only', () => {
    expect(canManageInstitution(role('5d2ad780-d6fe-4638-bffa-e541ff6266fe'))).toBe(false);
    expect(canManageInstitution(role())).toBe(false);
    expect(canManageInstitution(null)).toBe(false);
  });
});
