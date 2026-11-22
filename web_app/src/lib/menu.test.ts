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
  it('course department (Kepala / Staff Program Studi) menu', () => {
    const m = getMenuForRole('course_department');
    expect(m.map((i) => i.id)).toEqual(['dashboard', 'students', 'activities', 'lecturers', 'courses', 'curricula', 'class-codes', 'semesters', 'teaches', 'grades', 'advisers-academic', 'final-assignment', 'staff', 'change-password']);
    expect(m[0].href.startsWith('/course-department/institution/master/unit/')).toBe(true);
    expect(m[1].href).toBe('/course-department/academic/student/master/student');
  });
  it('administrator menu has the dashboard, every registered resource and change-password', () => {
    const m = getMenuForRole('administrator');
    expect(m[0].href).toBe('/administrator/dashboard');
    expect(m[0].labelKey).toBe('menu.administrator.adminDashboard');
    expect(m.map((i) => i.href)).toContain('/administrator/institution/master/unit');
    expect(m.map((i) => i.href)).toContain('/administrator/institution/reference/position-type');
    expect(m[m.length - 1].id).toBe('change-password');
  });
  it('candidate gets its dashboard and change-password', () => {
    const m = getMenuForRole('candidate');
    expect(m.map((i) => i.id)).toEqual(['dashboard', 'change-password']);
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

describe('administrator menu extras', () => {
  it('links the chatbot and the application preference', () => {
    const hrefs = getMenuForRole('administrator').map((i) => i.href);
    expect(hrefs).toContain('/administrator/agent/chatbot');
    expect(hrefs).toContain('/administrator/preference/application');
  });
});

describe('administrator feeder entry', () => {
  it('has one feeder link instead of a hundred table links', () => {
    const m = getMenuForRole('administrator');
    expect(m.filter((i) => i.href.startsWith('/administrator/feeder')).map((i) => i.href)).toEqual(['/administrator/feeder']);
  });
});
