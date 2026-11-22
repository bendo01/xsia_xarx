import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { loadIndividualProfile } from './individual-profile';

const ID = '11111111-1111-4111-8111-111111111111';
const as = (activeRole: string) => ({ activeRole }) as AuthState;

describe('loadIndividualProfile guards', () => {
  it('is administrator-only', async () => {
    for (const role of ['rectorat', 'student', 'lecturer']) await expect(loadIndividualProfile(as(role), ID)).rejects.toThrow('Forbidden');
  });
  it('rejects a malformed id before any request', async () => {
    await expect(loadIndividualProfile(as('administrator'), 'nope')).rejects.toThrow('Not found');
  });
});
