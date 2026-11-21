import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { resolveMyInstitution } from './institution';

const MINE = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

const auth = (over: Partial<AuthState> = {}) =>
  ({ activeRole: 'rectorat', activeRoleItem: { id: 'r', name: 'Rektor', institution_id: MINE }, ...over }) as AuthState;

describe('resolveMyInstitution', () => {
  it('resolves a placeholder to the role institution', () => {
    expect(resolveMyInstitution(auth(), '[id]')).toBe(MINE);
    expect(resolveMyInstitution(auth(), '')).toBe(MINE);
  });
  it('falls back to the configured default', () => {
    expect(resolveMyInstitution(auth({ activeRoleItem: null, defaultInstitutionId: OTHER }), '[id]')).toBe(OTHER);
  });
  it('accepts its own id and rejects another institution', () => {
    expect(resolveMyInstitution(auth(), MINE)).toBe(MINE);
    expect(() => resolveMyInstitution(auth(), OTHER)).toThrow('Institution not found');
  });
  it('rejects other roles', () => {
    expect(() => resolveMyInstitution(auth({ activeRole: 'student' }), MINE)).toThrow('Forbidden');
  });
});
