import { describe, expect, it } from 'vitest';

import { prodiRank, prodiRights } from './prodi-rights';

const role = (name: string, extra: Record<string, unknown> = {}) => ({ id: 'r', name, ...extra }) as any;

describe('prodiRank', () => {
  it('reads the position from the role name', () => {
    expect(prodiRank(role('Kepala Program Studi'))).toBe('head');
    expect(prodiRank(role('Kaprodi Informatika'))).toBe('head');
    expect(prodiRank(role('Sekretaris Program Studi'))).toBe('secretary');
    expect(prodiRank(role('Sekertaris Program Studi'))).toBe('secretary');
    expect(prodiRank(role('Staff Program Studi'))).toBe('staff');
    expect(prodiRank(role('Staf Prodi'))).toBe('staff');
  });
  it('falls back to the position type', () => {
    expect(prodiRank(role('User', { position_type_name: 'Staff Program Studi' }))).toBe('staff');
    expect(prodiRank(role('User', { position_type: { name: 'Kepala Program Studi' } }))).toBe('head');
  });
  it('anything else is "other"', () => {
    expect(prodiRank(role('Kajur'))).toBe('other');
    expect(prodiRank(role('BAAK'))).toBe('other');
    expect(prodiRank(null)).toBe('other');
  });
});

describe('prodiRights', () => {
  it('only an explicit staff position is restricted', () => {
    expect(prodiRights(role('Staff Program Studi'))).toEqual({ canDelete: false, canLockClass: false, canManageStaff: false });
    for (const n of ['Kepala Program Studi', 'Sekretaris Program Studi', 'Kajur', 'BAAK']) {
      expect(prodiRights(role(n))).toEqual({ canDelete: true, canLockClass: true, canManageStaff: true });
    }
    expect(prodiRights(null).canDelete).toBe(true);
  });
});
