// Auth data layer: server functions the UI calls directly (BFF). The browser
// only ever sees the safe slice returned here; the API token stays in the
// httpOnly session cookie (see src/server/session.ts).
import { formAction, query } from '@solidjs/router';
import { markSafeError, redirect } from '@solidjs/web';

import { apiFetch } from '../server/api';
import { getAuth, requireAuth, signIn, signOut, switchRole } from '../server/auth';
import { getDashboardPathForRole, LOGIN_PATH } from './roles';
import { safeReturnUrl } from './return-url';
import { isUuid } from './validation';

/** Who is signed in, their roles and the active role. Cached per request/key. */
export const getAuthState = query(async () => {
  'use server';
  return getAuth();
}, 'auth-state');

export const signInAction = formAction(async (formData: FormData) => {
  'use server';
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || !password) {
    throw markSafeError(new Error('Email and password are required'));
  }
  const auth = await signIn(email, password);
  const dest =
    safeReturnUrl(String(formData.get('return_url') ?? '')) ??
    getDashboardPathForRole(auth.activeRole, {
      role: auth.activeRoleItem,
      roles: auth.roles,
      user: auth.user,
      defaultInstitutionId: auth.defaultInstitutionId,
    });
  throw redirect(dest);
}, 'sign-in');

export const signOutAction = formAction(async () => {
  'use server';
  await signOut();
  throw redirect(LOGIN_PATH);
}, 'sign-out');

/** Switch active role, then land on that role's dashboard. */
export const changeRoleAction = formAction(async (roleId: string) => {
  'use server';
  const auth = await switchRole(roleId);
  throw redirect(
    getDashboardPathForRole(auth.activeRole, {
      role: auth.activeRoleItem,
      roles: auth.roles,
      user: auth.user,
      defaultInstitutionId: auth.defaultInstitutionId,
    }),
  );
}, 'change-role');

// ---- Account recovery / verification (public endpoints, no session) --------
// Plain 'use server' functions called from the pages' submit handlers: they need
// toasts, a WhatsApp deep link and a delayed redirect, so they return data
// instead of redirecting. API 4xx messages reach the UI (see apiFetch).

export interface AccountResult {
  message?: string;
  wa_link?: string;
}

export async function forgotPassword(email: string, phone_number: string): Promise<AccountResult> {
  'use server';
  return apiFetch<AccountResult>('forgot-password', {
    method: 'POST',
    auth: false,
    body: { email: email.trim(), phone_number: phone_number.trim() },
  });
}

export async function resetPassword(token: string, new_password: string): Promise<AccountResult> {
  'use server';
  if (!isUuid(token)) throw markSafeError(new Error('Invalid reset token'));
  return apiFetch<AccountResult>('reset-password', {
    method: 'POST',
    auth: false,
    body: { token, new_password },
  });
}

export async function verifyEmail(token: string): Promise<AccountResult> {
  'use server';
  // The token goes into the URL path: only a UUID may, so it cannot alter the route.
  if (!isUuid(token)) throw markSafeError(new Error('Invalid verification token'));
  return apiFetch<AccountResult>(`verify/${token}`, { auth: false });
}

/** Change the signed-in user's password (needs the current one; the API verifies it). */
export async function changePassword(current_password: string, new_password: string): Promise<AccountResult> {
  'use server';
  await requireAuth();
  if (new_password.length < 6) throw markSafeError(new Error('Password must be at least 6 characters'));
  return apiFetch<AccountResult>('change-password', {
    method: 'POST',
    body: { current_password, new_password },
  });
}
