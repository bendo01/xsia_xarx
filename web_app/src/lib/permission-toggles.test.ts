import { describe, expect, it } from 'vitest';

import { groupPermissions, splitPermissionName } from './permission-toggles';

const P = [
  { id: '1', name: 'academic.student.index', uri: '/api/v1/academic/student' },
  { id: '2', name: 'academic.student.create', uri: '/api/v1/academic/student' },
  { id: '3', name: 'auth.role.index', uri: '/api/v1/role' },
  { id: '4', name: 'health' },
];

describe('splitPermissionName', () => {
  it('splits on the last dot and files dotless names under "other"', () => {
    expect(splitPermissionName('academic.student.index')).toEqual({ controller: 'academic.student', action: 'index' });
    expect(splitPermissionName('health')).toEqual({ controller: 'other', action: 'health' });
  });
});

describe('groupPermissions', () => {
  it('groups by controller, sorted', () => {
    expect(groupPermissions(P, {}).map((g) => [g.controller, g.permissions.length])).toEqual([['academic.student', 2], ['auth.role', 1], ['other', 1]]);
  });
  it('filters by name or uri, case-insensitively', () => {
    expect(groupPermissions(P, {}, 'ROLE').map((g) => g.controller)).toEqual(['auth.role']);
    expect(groupPermissions(P, {}, '/api/v1/academic').flatMap((g) => g.permissions.map((p) => p.id))).toEqual(['1', '2']);
  });
  it('can keep only the assigned permissions', () => {
    expect(groupPermissions(P, { '3': 'link' }, '', true).map((g) => g.controller)).toEqual(['auth.role']);
  });
});
