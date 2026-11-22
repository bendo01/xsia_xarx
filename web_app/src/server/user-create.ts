// Create a login account as the administrator. The API's plain create stores the password as
// given, so accounts go through its register endpoint (which hashes it and mails a verification
// link); an account the administrator wants usable at once is then activated and marked verified.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import type { NewUserError } from '../lib/new-user';
import { parseNewUser } from '../lib/new-user';

type Raw = Record<string, any>;

export type CreateUserResult = { ok: true; id: string } | { ok: false; errors: Record<string, NewUserError> };

export async function createUserAccount(auth: AuthState, input: Raw): Promise<CreateUserResult> {
  requireAdministrator(auth);
  const parsed = parseNewUser(input);
  if (!parsed.ok) return parsed;
  const u = parsed.user;

  await apiFetch('register', { method: 'POST', body: { email: u.email, password: u.password, name: u.name, individual_id: u.individual_id } });

  const found = await apiPaginated<Raw>('user', { page: 1, per_page: 5, search: u.email }, { searchParam: 'search' });
  const created = found.data.find((r) => String(r.email ?? '').toLowerCase() === u.email);
  if (!created?.id) throw markSafeError(new Error('The account was created but could not be found to finish setting it up'));
  if (u.is_active) {
    await apiFetch(`user/${encodeURIComponent(String(created.id))}`, { method: 'PUT', body: { is_active: true, email_verified_at: new Date().toISOString().slice(0, 19) } });
  }
  return { ok: true, id: String(created.id) };
}
