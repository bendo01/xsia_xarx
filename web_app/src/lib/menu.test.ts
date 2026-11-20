import { describe, expect, it } from 'vitest';
import { getMenuForRole, isMenuItemActive } from './menu';

describe('getMenuForRole', () => {
  it('student menu starts with the profile page of their individual record', () => {
    const m = getMenuForRole('student', { user: { individual_id: 'ind-1' } });
    expect(m.map((i) => i.id)).toEqual(['profile', 'advisers', 'activities', 'directory', 'change-password']);
    expect(m[0].href).toBe('/student/person/master/individual/ind-1');
  });
  it('lecturer menu', () => {
    const m = getMenuForRole('lecturer', { user: { individual_id: 'i' } });
    expect(m[0].href).toBe('/lecturer/person/master/individual/i/show');
    expect(m[1].href).toBe('/lecturer/academic/campaign/transaction/teach');
  });
  it('other roles get their dashboard and change-password', () => {
    const m = getMenuForRole('administrator');
    expect(m.map((i) => i.href)).toEqual(['/administrator/dashboard', '/account/change-password']);
    expect(m[0].labelKey).toBe('menu.administrator.adminDashboard');
  });
  it('every menu item points inside the signed-in area or auth pages', () => {
    for (const role of ['student', 'lecturer', 'administrator', 'rectorat', 'course_department', 'candidate']) {
      for (const item of getMenuForRole(role)) expect(item.href.startsWith('/')).toBe(true);
    }
  });
});

describe('isMenuItemActive', () => {
  const item = { id: 'a', href: '/student/academic/student/adviser', labelKey: 'x', icon: 'user' as const };
  it('matches the path and its children, not lookalike siblings', () => {
    expect(isMenuItemActive(item, '/student/academic/student/adviser')).toBe(true);
    expect(isMenuItemActive(item, '/student/academic/student/adviser/9')).toBe(true);
    expect(isMenuItemActive(item, '/student/academic/student/adviser-x')).toBe(false);
  });
  it('exact items ignore children and trailing slashes', () => {
    const home = { ...item, href: '/student/person/master/individual/1', exact: true };
    expect(isMenuItemActive(home, '/student/person/master/individual/1/')).toBe(true);
    expect(isMenuItemActive(home, '/student/person/master/individual/1/edit')).toBe(false);
  });
});
