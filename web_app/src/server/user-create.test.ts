import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { createUserAccount } from './user-create';

const as = (activeRole: string) => ({ activeRole }) as AuthState;

describe('createUserAccount', () => {
  it('is administrator-only', async () => {
    for (const role of ['rectorat', 'student', 'lecturer']) await expect(createUserAccount(as(role), {})).rejects.toThrow('Forbidden');
  });
  it('returns field errors without calling the API', async () => {
    expect(await createUserAccount(as('administrator'), { name: '', email: 'x', password: 'short' })).toMatchObject({ ok: false, errors: { name: 'required', email: 'invalid', password: 'tooShort' } });
  });
});
