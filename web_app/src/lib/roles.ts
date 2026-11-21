// Pure role logic, shared by the server (middleware, server functions) and
// the browser. Ported from client/src/lib/authStore.ts with every storage and
// signal dependency removed: callers pass the data in, so this runs anywhere
// and is trivially testable.

export interface UserRoleItem {
  id: string;
  name: string;
  user_id?: string;
  position_type_id?: string;
  position_type_name?: string;
  position_type?: unknown;
  roleable_id?: string;
  roleable_type?: string;
  code?: string;
  unit_id?: string;
  institution_id?: string;
  institution_name?: string;
}

/** The slice of the signed-in user the app needs (kept small: cookie size). */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  individual_id?: string | null;
}

export type RoleKey =
  | 'administrator'
  | 'rectorat'
  | 'course_department'
  | 'lecturer'
  | 'student'
  | 'candidate'
  | 'user'
  | 'guest';

export function positionName(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const v = value as { name?: unknown; title?: unknown };
    const n = v.name ?? v.title;
    return typeof n === 'string' ? n : '';
  }
  return '';
}

export function isProgramStudiPosition(value: unknown): boolean {
  const lower = positionName(value).toLowerCase().trim();
  if (!lower) return false;
  return (
    lower.includes('kepala program studi') ||
    lower.includes('sekertaris program studi') ||
    lower.includes('sekretaris program studi') ||
    lower.includes('staff program studi') ||
    lower.includes('staf program studi') ||
    lower.includes('staff prodi') ||
    lower.includes('staf prodi') ||
    lower.includes('kaprodi') ||
    lower.includes('sekprodi')
  );
}

export function isStaffProgramStudi(
  role?: UserRoleItem | string | null,
): boolean {
  if (!role) return false;
  if (typeof role === 'string') return isProgramStudiPosition(role);
  return (
    isProgramStudiPosition(role.name) ||
    isProgramStudiPosition(role.position_type) ||
    isProgramStudiPosition(role.position_type_name)
  );
}

const RECTORAT_KEYWORDS = [
  'rektor',
  'rector',
  'dekan',
  'decan',
  'fakultas',
  'yayasan',
  'pimpinan',
  'biro_administrasi',
  'pdpt',
  'pengembangan_teknologi_informasi',
  'sekertaris_rektor',
  'sekretaris_rektor',
  'lpti',
  'bauk',
];
const CANDIDATE_KEYWORDS = [
  'kandidat',
  'candidate',
  'camaba',
  'pmb',
  'applicant',
  'calon_mahasiswa',
];
const STUDENT_KEYWORDS = ['mahasiswa', 'student', 'mhs'];
const LECTURER_KEYWORDS = [
  'dosen',
  'lecturer',
  'pengajar',
  'instructor',
  'faculty',
];
const COURSE_DEPARTMENT_KEYWORDS = [
  'prodi',
  'jurusan',
  'kajur',
  'kaprodi',
  'sekprodi',
  'department',
  'course',
  'baak',
  'program_studi',
  'programstudi',
  'kepala_program_studi',
  'sekertaris_program_studi',
  'sekretaris_program_studi',
  'staff_program_studi',
  'staf_program_studi',
];

const hasAny = (s: string, words: string[]) => words.some((w) => s.includes(w));

/**
 * Maps a backend role name (free text, Indonesian or English) onto one of the
 * app's role keys. Order matters: rectorat keywords are checked before the
 * generic "admin" so e.g. "biro administrasi" is not read as administrator.
 */
export function normalizeRoleName(
  rawRole: string | null | undefined,
  roleItem?: UserRoleItem | null,
): RoleKey | string {
  if (roleItem && isStaffProgramStudi(roleItem)) return 'course_department';
  if (!rawRole) return 'guest';
  const lower = rawRole.toLowerCase().trim().replace(/[-\s]+/g, '_');

  if (hasAny(lower, RECTORAT_KEYWORDS)) return 'rectorat';
  if (lower.includes('admin')) return 'administrator';
  if (hasAny(lower, CANDIDATE_KEYWORDS)) return 'candidate';
  if (hasAny(lower, STUDENT_KEYWORDS)) return 'student';
  if (hasAny(lower, LECTURER_KEYWORDS)) return 'lecturer';
  if (hasAny(lower, COURSE_DEPARTMENT_KEYWORDS)) return 'course_department';
  if (lower === 'user' || lower === 'staff') {
    return isStaffProgramStudi(rawRole) ? 'course_department' : 'user';
  }
  return lower;
}

export const ROLE_ROUTE_PREFIXES: { prefix: string; role: RoleKey }[] = [
  { prefix: '/administrator', role: 'administrator' },
  { prefix: '/course-department', role: 'course_department' },
  { prefix: '/student', role: 'student' },
  { prefix: '/lecturer', role: 'lecturer' },
  { prefix: '/candidate', role: 'candidate' },
  { prefix: '/rectorat', role: 'rectorat' },
];

export const LOGIN_PATH = '/authentification/login_with_session';

/** Areas any signed-in user may open, whatever their role (e.g. change password). */
export const AUTH_ONLY_PREFIXES = ['/account'];

export function isAuthOnlyPath(pathname: string): boolean {
  const clean = pathname.split('?')[0].split('#')[0];
  return AUTH_ONLY_PREFIXES.some((p) => clean === p || clean.startsWith(`${p}/`));
}

export function getRequiredRoleForPath(pathname: string): RoleKey | null {
  const clean = pathname.split('?')[0].split('#')[0];
  const hit = ROLE_ROUTE_PREFIXES.find(
    (p) => clean === p.prefix || clean.startsWith(`${p.prefix}/`),
  );
  return hit ? hit.role : null;
}

export interface DashboardContext {
  /** Role item the dashboard is for (carries unit/institution ids). */
  role?: UserRoleItem | null;
  /** All the user's roles (used to find a candidate record). */
  roles?: UserRoleItem[];
  user?: Pick<SessionUser, 'individual_id'> | null;
  /** Fallback institution for rectorat when the role has none. */
  defaultInstitutionId?: string;
}

/** Home page for a role. Mirrors client getDashboardPathForRole. */
export function getDashboardPathForRole(
  roleName: string,
  ctx: DashboardContext = {},
): string {
  const { role, roles = [], user, defaultInstitutionId } = ctx;
  const indId = user?.individual_id ?? '';

  const unitId = (() => {
    if (!role) return '';
    if (role.unit_id) return role.unit_id;
    const isStaff =
      role.roleable_type?.includes('Staff') || isStaffProgramStudi(role);
    return !isStaff && role.roleable_id ? role.roleable_id : '';
  })();
  const coursePath = unitId
    ? `/course-department/institution/master/unit/${unitId}`
    : '/course-department/institution/master/unit/[id]';

  if (role && isStaffProgramStudi(role)) return coursePath;

  switch (normalizeRoleName(roleName, role)) {
    case 'administrator':
      return '/administrator/dashboard';
    case 'course_department':
      return coursePath;
    case 'student':
      return indId
        ? `/student/person/master/individual/${indId}`
        : '/student/person/master/individual/[id]';
    case 'lecturer':
      return indId
        ? `/lecturer/person/master/individual/${indId}/show`
        : '/lecturer/person/master/individual/[id]/show';
    case 'candidate': {
      const cand =
        role?.roleable_id
          ? role
          : roles.find((r) => r.roleable_type?.includes('Candidate') && r.roleable_id);
      return cand?.roleable_id
        ? `/candidate/academic/candidate/master/candidate/${cand.roleable_id}`
        : '/candidate/academic/candidate/master/candidate';
    }
    case 'rectorat': {
      const inst = role?.institution_id || defaultInstitutionId || '';
      return `/rectorat/institution/${inst}`;
    }
    default:
      if (isStaffProgramStudi(roleName)) return coursePath;
      return indId
        ? `/student/person/master/individual/${indId}`
        : '/student/person/master/individual/[id]';
  }
}

/** What the guard knows about the caller. `null` role/roles = signed out. */
export interface AccessSubject {
  authenticated: boolean;
  /** Normalised key of the active role. */
  activeRole: string;
  roles: UserRoleItem[];
  user?: Pick<SessionUser, 'individual_id'> | null;
  activeRoleItem?: UserRoleItem | null;
  defaultInstitutionId?: string;
}

export interface RouteAccessResult {
  allowed: boolean;
  redirectTo?: string;
  /** Allowed, but only after switching to this role (multi-role users). */
  switchRole?: UserRoleItem;
  reason?: 'unauthenticated' | 'unauthorized';
}

/** Pure port of client canAccessRoute. */
export function evaluateRouteAccess(
  pathname: string,
  subject: AccessSubject,
): RouteAccessResult {
  const required = getRequiredRoleForPath(pathname);
  if (!required && !isAuthOnlyPath(pathname)) return { allowed: true };

  if (!subject.authenticated) {
    const clean = pathname.split('#')[0];
    return {
      allowed: false,
      redirectTo: `${LOGIN_PATH}?return_url=${encodeURIComponent(clean)}`,
      reason: 'unauthenticated',
    };
  }

  if (!required || subject.activeRole === required) return { allowed: true };

  const match = subject.roles.find(
    (r) => normalizeRoleName(r.name, r) === required,
  );
  if (match) return { allowed: true, switchRole: match };

  const isAdmin =
    subject.activeRole === 'administrator' ||
    subject.roles.some((r) => normalizeRoleName(r.name, r) === 'administrator');
  if (isAdmin) return { allowed: true };

  return {
    allowed: false,
    redirectTo: getDashboardPathForRole(subject.activeRole, {
      role: subject.activeRoleItem,
      roles: subject.roles,
      user: subject.user,
      defaultInstitutionId: subject.defaultInstitutionId,
    }),
    reason: 'unauthorized',
  };
}

const GUEST_ONLY_PATHS = [
  '/authentification/login',
  '/authentification/login_with_session',
];

/**
 * Sign-in pages are for signed-out visitors: a signed-in user is sent to their
 * own dashboard instead. Returns the redirect target, or null to render the page.
 */
export function guestOnlyRedirect(pathname: string, subject: AccessSubject): string | null {
  const clean = pathname.split('?')[0].replace(/\/+$/, '');
  if (!subject.authenticated || !GUEST_ONLY_PATHS.includes(clean)) return null;
  return getDashboardPathForRole(subject.activeRole, {
    role: subject.activeRoleItem,
    roles: subject.roles,
    user: subject.user,
    defaultInstitutionId: subject.defaultInstitutionId,
  });
}
