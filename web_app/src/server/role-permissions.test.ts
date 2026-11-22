import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { assignPermission, loadPermissionEditor, revokePermission } from './role-permissions';

const ID = '11111111-1111-4111-8111-111111111111';
const as = (activeRole: string) => ({ activeRole }) as AuthState;

describe('permission editor guards', () => {
  it('is administrator-only', async () => {
    for (const role of ['rectorat', 'student', 'course_department']) {
      await expect(loadPermissionEditor(as(role), 'role', ID)).rejects.toThrow('Forbidden');
      await expect(assignPermission(as(role), 'role', ID, ID)).rejects.toThrow('Forbidden');
      await expect(revokePermission(as(role), 'role', ID, ID)).rejects.toThrow('Forbidden');
    }
  });
  it('rejects unknown owner kinds and malformed ids before any request', async () => {
    const admin = as('administrator');
    await expect(loadPermissionEditor(admin, 'user', ID)).rejects.toThrow('Not found');
    await expect(loadPermissionEditor(admin, 'role', 'x')).rejects.toThrow('Not found');
    await expect(assignPermission(admin, 'role', ID, 'nope')).rejects.toThrow('Not found');
    await expect(revokePermission(admin, 'position-type', ID, 'nope')).rejects.toThrow('Not found');
  });
});
