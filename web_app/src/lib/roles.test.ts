import { describe, expect, it } from 'vitest';
import {
  evaluateRouteAccess,
  getDashboardPathForRole,
  getRequiredRoleForPath,
  isAuthOnlyPath,
  guestOnlyRedirect,
  isStaffProgramStudi,
  normalizeRoleName,
  type AccessSubject,
  type UserRoleItem,
} from './roles';

const role = (name: string, extra: Partial<UserRoleItem> = {}): UserRoleItem => ({
  id: name,
  name,
  ...extra,
});

describe('normalizeRoleName', () => {
  it.each([
    ['Administrator', 'administrator'],
    ['Dekan Fakultas Teknik', 'rectorat'],
    ['Biro Administrasi', 'rectorat'],
    ['Mahasiswa', 'student'],
    ['Dosen', 'lecturer'],
    ['Calon Mahasiswa', 'candidate'],
    ['Kepala Program Studi', 'course_department'],
    ['Staff', 'user'],
    [null, 'guest'],
    [undefined, 'guest'],
  ])('%s -> %s', (raw, expected) => {
    expect(normalizeRoleName(raw)).toBe(expected);
  });

  it('treats a role item with a prodi position as course_department', () => {
    const item = role('Dosen', { position_type_name: 'Sekretaris Program Studi' });
    expect(normalizeRoleName('Dosen', item)).toBe('course_department');
  });
});

describe('isStaffProgramStudi', () => {
  it('reads name, position_type and position_type_name', () => {
    expect(isStaffProgramStudi('Kaprodi TI')).toBe(true);
    expect(isStaffProgramStudi(role('x', { position_type: { name: 'Staf Prodi' } }))).toBe(true);
    expect(isStaffProgramStudi(role('Dosen'))).toBe(false);
    expect(isStaffProgramStudi(null)).toBe(false);
  });
});

describe('getRequiredRoleForPath', () => {
  it('matches prefixes only on segment boundaries', () => {
    expect(getRequiredRoleForPath('/student')).toBe('student');
    expect(getRequiredRoleForPath('/student/person?x=1')).toBe('student');
    expect(getRequiredRoleForPath('/students')).toBeNull();
    expect(getRequiredRoleForPath('/authentification/login')).toBeNull();
    expect(getRequiredRoleForPath('/')).toBeNull();
  });
});

describe('evaluateRouteAccess', () => {
  const student: AccessSubject = {
    authenticated: true,
    activeRole: 'student',
    roles: [role('Mahasiswa')],
    user: { individual_id: 'ind-1' },
  };

  it('allows public paths for anyone', () => {
    expect(evaluateRouteAccess('/', { ...student, authenticated: false }).allowed).toBe(true);
  });

  it('sends signed-out users to login with return_url', () => {
    const r = evaluateRouteAccess('/student/x?a=1', { ...student, authenticated: false });
    expect(r).toMatchObject({ allowed: false, reason: 'unauthenticated' });
    expect(r.redirectTo).toBe(
      '/authentification/login_with_session?return_url=' + encodeURIComponent('/student/x?a=1'),
    );
  });

  it('allows the active role', () => {
    expect(evaluateRouteAccess('/student/a', student).allowed).toBe(true);
  });

  it('asks a multi-role user to switch role', () => {
    const multi = { ...student, roles: [role('Mahasiswa'), role('Dosen')] };
    const r = evaluateRouteAccess('/lecturer/a', multi);
    expect(r.allowed).toBe(true);
    expect(r.switchRole?.name).toBe('Dosen');
  });

  it('lets administrators into every area', () => {
    const admin: AccessSubject = { authenticated: true, activeRole: 'administrator', roles: [role('Administrator')] };
    expect(evaluateRouteAccess('/rectorat/x', admin).allowed).toBe(true);
  });

  it('redirects an unauthorised user to their own dashboard', () => {
    const r = evaluateRouteAccess('/administrator/dashboard', student);
    expect(r).toMatchObject({ allowed: false, reason: 'unauthorized' });
    expect(r.redirectTo).toBe('/student/person/master/individual/ind-1');
  });
});

describe('getDashboardPathForRole', () => {
  it('builds per-role home paths', () => {
    expect(getDashboardPathForRole('Administrator')).toBe('/administrator/dashboard');
    expect(getDashboardPathForRole('Dosen', { user: { individual_id: 'i' } })).toBe(
      '/lecturer/person/master/individual/i/show',
    );
    expect(
      getDashboardPathForRole('Kaprodi', { role: role('Kaprodi', { unit_id: 'u1' }) }),
    ).toBe('/course-department/institution/master/unit/u1');
    expect(
      getDashboardPathForRole('Rektor', { role: role('Rektor', { institution_id: 'inst' }) }),
    ).toBe('/rectorat/institution/inst');
  });
});

describe('guestOnlyRedirect', () => {
  const user: AccessSubject = {
    authenticated: true,
    activeRole: 'administrator',
    roles: [role('Administrator')],
  };
  it('sends signed-in users away from the login pages', () => {
    expect(guestOnlyRedirect('/authentification/login_with_session', user)).toBe('/administrator/dashboard');
    expect(guestOnlyRedirect('/authentification/login/?x=1', user)).toBe('/administrator/dashboard');
  });
  it('leaves signed-out visitors and other pages alone', () => {
    expect(guestOnlyRedirect('/authentification/login', { ...user, authenticated: false })).toBeNull();
    expect(guestOnlyRedirect('/authentification/forgot-password', user)).toBeNull();
    expect(guestOnlyRedirect('/', user)).toBeNull();
  });
});

describe('auth-only areas (/account)', () => {
  const student: AccessSubject = { authenticated: true, activeRole: 'student', roles: [role('Mahasiswa')] };
  it('is open to any signed-in role, closed to signed-out visitors', () => {
    expect(isAuthOnlyPath('/account/change-password')).toBe(true);
    expect(isAuthOnlyPath('/accounting')).toBe(false);
    expect(evaluateRouteAccess('/account/change-password', student).allowed).toBe(true);
    const out = evaluateRouteAccess('/account/change-password', { ...student, authenticated: false });
    expect(out).toMatchObject({ allowed: false, reason: 'unauthenticated' });
  });
});
