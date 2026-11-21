// Navigation per role, as data. The old client had one JSX component per role
// (administrator alone is 2,364 lines); data keeps the shell, the command
// palette and the active-item logic on a single source of truth.
import { getDashboardPathForRole, type DashboardContext } from './roles';

export type IconName = 'user' | 'users' | 'book' | 'graduation' | 'lock' | 'unlock' | 'printer' | 'home' | 'chalkboard' | 'library' | 'clipboard' | 'tags';

export interface MenuItem {
  id: string;
  href: string;
  /** i18n key (see src/i18n). */
  labelKey: string;
  icon: IconName;
  /** Match only this exact path (default: this path and everything under it). */
  exact?: boolean;
}

export const CHANGE_PASSWORD_PATH = '/account/change-password';

const changePassword: MenuItem = {
  id: 'change-password',
  href: CHANGE_PASSWORD_PATH,
  labelKey: 'au.ubahKataSandi',
  icon: 'lock',
};

const DASHBOARD_LABEL: Record<string, string> = {
  administrator: 'menu.administrator.adminDashboard',
  rectorat: 'menu.rectorat.executiveDashboard',
  course_department: 'menu.courseDepartment.departmentDashboard',
  candidate: 'menu.candidate.candidateDashboard',
};

/**
 * Menu for an active role (a key from normalizeRoleName). Roles whose full
 * menus are not ported yet get their dashboard plus change-password.
 */
export function getMenuForRole(roleKey: string, ctx: DashboardContext = {}): MenuItem[] {
  const home = getDashboardPathForRole(roleKey, ctx);

  switch (roleKey) {
    case 'student':
      return [
        { id: 'profile', href: home, labelKey: 'menu.student.dashboardProfile', icon: 'user', exact: true },
        { id: 'advisers', href: '/student/academic/student/adviser', labelKey: 'menu.student.academicAdvisers', icon: 'users' },
        { id: 'activities', href: '/student/academic/student/campaign/activity', labelKey: 'menu.student.academicActivities', icon: 'book' },
        { id: 'directory', href: '/student/academic/student/master', labelKey: 'menu.student.admittedStudents', icon: 'graduation' },
        changePassword,
      ];
    case 'lecturer':
      return [
        { id: 'profile', href: home, labelKey: 'menu.lecturer.lecturerProfile', icon: 'user', exact: true },
        { id: 'teach', href: '/lecturer/academic/campaign/transaction/teach', labelKey: 'menu.lecturer.teachingActivities', icon: 'chalkboard' },
        changePassword,
      ];
    case 'course_department':
      // Kepala and Staff Program Studi share one area; the API scopes the data to their unit.
      return [
        { id: 'dashboard', href: home, labelKey: 'menu.courseDepartment.departmentDashboard', icon: 'home', exact: true },
        { id: 'students', href: '/course-department/academic/student/master/student', labelKey: 'menu.courseDepartment.studentDirectory', icon: 'graduation' },
        { id: 'activities', href: '/course-department/academic/student/campaign/activity', labelKey: 'menu.courseDepartment.studentActivity', icon: 'book' },
        { id: 'lecturers', href: '/course-department/academic/lecturer/master/lecturer', labelKey: 'menu.courseDepartment.lecturerDirectory', icon: 'chalkboard' },
        { id: 'courses', href: '/course-department/academic/course/master/course', labelKey: 'menu.courseDepartment.courseDirectory', icon: 'library' },
        { id: 'curricula', href: '/course-department/academic/course/master/curriculum', labelKey: 'menu.courseDepartment.curriculumDirectory', icon: 'clipboard' },
        { id: 'class-codes', href: '/course-department/academic/campaign/transaction/class-code', labelKey: 'menu.courseDepartment.classCodeDirectory', icon: 'tags' },
        { id: 'semesters', href: '/course-department/academic/campaign/transaction/activity', labelKey: 'menu.courseDepartment.activityDirectory', icon: 'book' },
        { id: 'teaches', href: '/course-department/academic/campaign/transaction/teach', labelKey: 'menu.courseDepartment.teachDirectory', icon: 'chalkboard' },
        { id: 'grades', href: '/course-department/academic/campaign/transaction/grade', labelKey: 'menu.courseDepartment.gradeDirectory', icon: 'graduation' },
        { id: 'advisers-academic', href: '/course-department/academic/student/adviser', labelKey: 'menu.courseDepartment.adviserDirectory', icon: 'users' },
        { id: 'final-assignment', href: '/course-department/academic/student/final-assignment/transaction/submission', labelKey: 'menu.courseDepartment.finalAssignmentDirectory', icon: 'graduation' },
        { id: 'staff', href: '/course-department/institution/master/staff', labelKey: 'menu.courseDepartment.staffDirectory', icon: 'users' },
        changePassword,
      ];
    case 'rectorat':
      // Read-only institution area; the API scopes the data to the caller's institution.
      return [
        { id: 'dashboard', href: home, labelKey: 'menu.rectorat.facultiesDepartments', icon: 'home', exact: true },
        { id: 'students', href: `${home}/student`, labelKey: 'menu.rectorat.studentList', icon: 'graduation' },
        { id: 'student-activities', href: `${home}/student-activity`, labelKey: 'menu.rectorat.studentActivityList', icon: 'book' },
        { id: 'lecturers', href: `${home}/lecturer`, labelKey: 'menu.rectorat.lecturerList', icon: 'chalkboard' },
        { id: 'courses', href: `${home}/course`, labelKey: 'menu.rectorat.courseList', icon: 'library' },
        { id: 'curricula', href: `${home}/curriculum`, labelKey: 'menu.rectorat.curriculumList', icon: 'clipboard' },
        { id: 'activities', href: `${home}/activity`, labelKey: 'menu.rectorat.activityUnitList', icon: 'book' },
        { id: 'class-codes', href: `${home}/class-code`, labelKey: 'menu.rectorat.classCodeUnitList', icon: 'tags' },
        { id: 'teaches', href: `${home}/teach`, labelKey: 'menu.rectorat.teachActivityList', icon: 'chalkboard' },
        { id: 'candidates', href: `${home}/candidate`, labelKey: 'menu.rectorat.candidateList', icon: 'users' },
        { id: 'employees', href: `${home}/employee`, labelKey: 'menu.rectorat.employees', icon: 'users' },
        { id: 'feeder', href: `${home}/feeder`, labelKey: 'rt.feeder', icon: 'library' },
        { id: 'staff', href: `${home}/staff`, labelKey: 'menu.rectorat.staff', icon: 'users' },
        { id: 'grades', href: `${home}/grade`, labelKey: 'menu.rectorat.gradeUnitList', icon: 'graduation' },
        changePassword,
      ];
    default:
      return [
        {
          id: 'dashboard',
          href: home,
          labelKey: DASHBOARD_LABEL[roleKey] ?? 'menu.student.dashboardProfile',
          icon: 'home',
          exact: true,
        },
        changePassword,
      ];
  }
}

/** Whether `item` should be highlighted for the current path. */
export function isMenuItemActive(item: MenuItem, pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  const href = item.href.replace(/\/+$/, '') || '/';
  return item.exact ? path === href : path === href || path.startsWith(`${href}/`);
}
