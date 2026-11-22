// Administrator-only reads. The API gives this role DataScope::All and bypasses RBAC, so this layer
// only has to make sure the caller really is an administrator before anything is fetched.
import { markSafeError } from '@solidjs/web';

import { apiPaginated } from './api';
import type { AuthState } from './auth';
import { isUuid } from '../lib/validation';

const ZERO = '00000000-0000-0000-0000-000000000000';

/** Throws `Forbidden` unless the active role is administrator. */
export function requireAdministrator(auth: AuthState): void {
  if (auth.activeRole !== 'administrator') throw markSafeError(new Error('Forbidden'));
}

/**
 * The institution an administrator is browsing: any real UUID is allowed; a placeholder in the URL
 * means "mine" (role, then the configured default).
 */
export function resolveAnyInstitution(auth: AuthState, raw = ''): string {
  requireAdministrator(auth);
  const v = raw.trim();
  const placeholder = !v || v === '[id]' || v === ':id' || v === ZERO;
  const id = placeholder ? auth.activeRoleItem?.institution_id || auth.defaultInstitutionId || '' : v;
  if (!isUuid(id) || id === ZERO) throw markSafeError(new Error('Institution not found'));
  return id;
}

export interface AdministratorCounts {
  users: number;
  roles: number;
  permissions: number;
  individuals: number;
  institutions: number;
}

const COUNT_SOURCES: [keyof AdministratorCounts, string][] = [
  ['users', 'user'],
  ['roles', 'role'],
  ['permissions', 'permission'],
  ['individuals', 'person/master/individual'],
  ['institutions', 'institution/master/institutions'],
];

/** Totals for the dashboard cards: one page-size-1 request per source; a failed source counts as 0. */
export async function loadAdministratorCounts(): Promise<AdministratorCounts> {
  const results = await Promise.allSettled(COUNT_SOURCES.map(([, path]) => apiPaginated(path, { page: 1, per_page: 1 })));
  const counts = { users: 0, roles: 0, permissions: 0, individuals: 0, institutions: 0 } satisfies AdministratorCounts;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') counts[COUNT_SOURCES[i][0]] = r.value.pagination.total_data;
  });
  return counts;
}
