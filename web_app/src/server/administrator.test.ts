import { describe, expect, it } from 'vitest';

import { loadPersonStatistics, requireAdministrator, resolveAnyInstitution } from './administrator';
import type { AuthState } from './auth';

const MINE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const auth = (over: Partial<AuthState> = {}) =>
  ({ activeRole: 'administrator', activeRoleItem: { id: 'r', name: 'Administrator', institution_id: MINE }, ...over }) as AuthState;

describe('requireAdministrator', () => {
  it('lets an administrator through and rejects every other role', () => {
    expect(() => requireAdministrator(auth())).not.toThrow();
    for (const role of ['rectorat', 'student', 'lecturer', 'course_department', 'guest'] as const) {
      expect(() => requireAdministrator(auth({ activeRole: role }))).toThrow('Forbidden');
    }
  });
});

describe('resolveAnyInstitution', () => {
  it('resolves a placeholder to the role institution, then the default', () => {
    expect(resolveAnyInstitution(auth(), '[id]')).toBe(MINE);
    expect(resolveAnyInstitution(auth({ activeRoleItem: null, defaultInstitutionId: OTHER }), '')).toBe(OTHER);
  });
  it('accepts any real institution id', () => {
    expect(resolveAnyInstitution(auth(), OTHER)).toBe(OTHER);
  });
  it('rejects garbage ids and non-administrators', () => {
    expect(() => resolveAnyInstitution(auth(), 'nope')).toThrow('Institution not found');
    expect(() => resolveAnyInstitution(auth({ activeRoleItem: null }), '[id]')).toThrow('Institution not found');
    expect(() => resolveAnyInstitution(auth({ activeRole: 'rectorat' }), OTHER)).toThrow('Forbidden');
  });
});

describe('loadPersonStatistics', () => {
  it('is administrator-only', async () => {
    await expect(loadPersonStatistics(auth({ activeRole: 'rectorat' }))).rejects.toThrow('Forbidden');
  });
});
