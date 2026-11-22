// Server-side auth state: derives "who is calling and in which role" from the
// signed session cookie, and implements sign-in / role switch against the Rust
// API. The JWT is kept in the cookie only; callers get the safe slice.
import { markSafeError } from '@solidjs/web';
import { env } from 'virtual:solid-env/server';

import {
  isStaffProgramStudi,
  normalizeRoleName,
  type AccessSubject,
  type SessionUser,
  type UserRoleItem,
} from '../lib/roles';
import { apiFetch } from './api';
import { clearSession, getSession, setSession, type SessionData } from './session';

interface BackendRole {
  id: string;
  name: string;
  user_id?: string | null;
  position_type_id?: string | null;
  roleable_id?: string | null;
  roleable_type?: string | null;
}

interface BackendUser {
  id: string;
  name: string;
  email: string;
  individual_id?: string | null;
  current_role_id?: string | null;
  roles?: BackendRole[] | null;
}

interface LoginResponse {
  token: string;
  user: BackendUser;
}

/** `exp` (seconds) from a JWT payload, or null. Not a signature check: the API is the authority. */
export function jwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return typeof json.exp === 'number' ? json.exp : null;
  } catch {
    return null;
  }
}

export function isTokenLive(token: string | undefined, nowMs = Date.now()): boolean {
  if (!token) return false;
  const exp = jwtExpiry(token);
  return exp === null || nowMs < exp * 1000;
}

/** Keep only what the app uses: the cookie is capped at ~4KB. */
export function slimRoles(roles: BackendRole[] | null | undefined): UserRoleItem[] {
  return (roles ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    ...(r.user_id ? { user_id: r.user_id } : {}),
    ...(r.position_type_id ? { position_type_id: r.position_type_id } : {}),
    ...(r.roleable_id ? { roleable_id: r.roleable_id } : {}),
    ...(r.roleable_type ? { roleable_type: r.roleable_type } : {}),
  }));
}

const isStudentRole = (r: UserRoleItem) =>
  normalizeRoleName(r.name, r) === 'student' || !!r.roleable_type?.includes('Student');
const isStaffRole = (r: UserRoleItem) =>
  ['rectorat', 'course_department'].includes(normalizeRoleName(r.name, r) as string) ||
  isStaffProgramStudi(r) ||
  !!r.roleable_type?.includes('Staff');

interface UnitRecord {
  institution_id?: string | null;
  institution?: { id?: string | null } | null;
}

/**
 * The API's role rows carry only a polymorphic `roleable_id`; the dashboard
 * needs the unit / institution behind it (students -> student -> unit,
 * staff -> staff -> unit), as client/authStore's enrichment did. Best effort:
 * a failed lookup leaves the role as is rather than blocking sign-in.
 */
export async function enrichRoles(
  roles: UserRoleItem[],
  token: string,
): Promise<UserRoleItem[]> {
  const get = async <T>(path: string): Promise<T | null> => {
    try {
      const res = await apiFetch<{ data?: T } & Record<string, unknown>>(path, { token });
      return ((res && 'data' in res && res.data) || res) as T;
    } catch {
      return null;
    }
  };

  return Promise.all(
    roles.map(async (role) => {
      if (!role.roleable_id) return role;
      const out: UserRoleItem = { ...role };
      let unitId: string | undefined;
      if (isStudentRole(role)) {
        const std = await get<{ code?: string; unit_id?: string }>(
          `academic/student/master/students/${encodeURIComponent(role.roleable_id)}`,
        );
        if (std?.code) out.code = std.code;
        unitId = std?.unit_id;
      } else if (isStaffRole(role)) {
        const staff = await get<{ unit_id?: string }>(
          `institution/master/staffes/${encodeURIComponent(role.roleable_id)}`,
        );
        unitId = staff?.unit_id;
      }
      if (unitId) {
        out.unit_id = unitId;
        const unit = await get<UnitRecord>(
          `institution/master/units/${encodeURIComponent(unitId)}`,
        );
        const inst = unit?.institution_id ?? unit?.institution?.id;
        if (inst) out.institution_id = inst;
      }
      return out;
    }),
  );
}

export interface AuthState extends AccessSubject {
  user: SessionUser | null;
  activeRoleId: string | null;
}

const SIGNED_OUT: AuthState = {
  authenticated: false,
  activeRole: 'guest',
  roles: [],
  user: null,
  activeRoleId: null,
  activeRoleItem: null,
};

export function authStateFrom(session: SessionData | null): AuthState {
  if (!session?.user || !isTokenLive(session.token)) return SIGNED_OUT;
  const roles = session.roles ?? [];
  const activeRoleItem =
    roles.find((r) => r.id === session.activeRoleId) ?? roles[0] ?? null;
  return {
    authenticated: true,
    activeRole: normalizeRoleName(activeRoleItem?.name, activeRoleItem),
    roles,
    user: session.user,
    activeRoleId: activeRoleItem?.id ?? null,
    activeRoleItem,
    defaultInstitutionId: env.VITE_CURRENT_INSTITUTION_ID || undefined,
  };
}

export async function getAuth(): Promise<AuthState> {
  return authStateFrom(await getSession());
}

/** Throws unless signed in; for server functions that must be gated. */
export async function requireAuth(): Promise<AuthState> {
  const auth = await getAuth();
  if (!auth.authenticated) throw markSafeError(new Error('Not signed in'));
  return auth;
}

export function sessionFromLogin(res: LoginResponse): SessionData {
  const roles = slimRoles(res.user.roles);
  const active =
    roles.find((r) => r.id === res.user.current_role_id) ?? roles[0];
  return {
    token: res.token,
    user: {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      individual_id: res.user.individual_id ?? null,
    },
    roles,
    activeRoleId: active?.id,
  };
}

/** Verify credentials against the API and write the session cookie. */
export async function signIn(email: string, password: string): Promise<AuthState> {
  const res = await apiFetch<LoginResponse>('login', {
    method: 'POST',
    auth: false,
    body: { email, password },
  });
  const session = sessionFromLogin(res);
  session.roles = await enrichRoles(session.roles ?? [], res.token);
  await setSession(session);
  return authStateFrom(session);
}

/** The configured institution's id (public pages cannot pick one). */
export function institutionIdFromEnv(): string {
  const id = env.VITE_CURRENT_INSTITUTION_ID;
  if (!id) throw markSafeError(new Error('Institution is not configured'));
  return id;
}

/**
 * Public candidate self-registration. The institution comes from server config, never the
 * browser. The API answers like a login (token + user), so the new candidate is signed in at once.
 */
export async function registerCandidate(form: Record<string, string>): Promise<AuthState> {
  const res = await apiFetch<LoginResponse>('academic/candidate/admission/register', {
    method: 'POST',
    auth: false,
    body: {
      institution_code: env.VITE_INSTITUTION_CODE.replace(/^["']|["']$/g, '').trim(),
      name: form.name.trim(),
      nik: form.nik.trim(),
      birth_place: form.birth_place.trim(),
      birth_date: form.birth_date,
      gender_id: form.gender_id,
      religion_id: form.religion_id,
      student_national_number: form.student_national_number.trim() || null,
      school_name: form.school_name.trim() || null,
      phone_number: form.phone_number.trim(),
      email: form.email.trim(),
      password: form.password,
    },
  });
  const session = sessionFromLogin(res);
  session.roles = await enrichRoles(session.roles ?? [], res.token);
  await setSession(session);
  return authStateFrom(session);
}

export async function signOut(): Promise<void> {
  await clearSession();
}

/**
 * Tell the API the active role changed (it drives data scope) and return the
 * session payload to persist. Writing is left to the caller: server functions
 * use setSession, the middleware hand-builds a redirect with the cookie.
 */
export async function applyRoleSwitch(roleId: string): Promise<SessionData> {
  const session = await getSession();
  if (!session?.user) throw new Error('Not signed in');
  await apiFetch(`user/set_current_role/${encodeURIComponent(roleId)}`, {
    method: 'POST',
  });
  return { ...session, activeRoleId: roleId };
}

export async function switchRole(roleId: string): Promise<AuthState> {
  const next = await applyRoleSwitch(roleId);
  await setSession(next);
  return authStateFrom(next);
}
