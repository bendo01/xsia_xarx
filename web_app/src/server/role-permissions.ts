// Permission assignments of a role or a position type (the old client's toggle list). The API's
// RBAC bypass means only an administrator reaches this; the role is checked here as well.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { PERMISSION_OWNERS, type PermissionOwnerKind, type PermissionRow } from '../lib/permission-toggles';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));

function owner(auth: AuthState, kind: string, id: string) {
  requireAdministrator(auth);
  const o = PERMISSION_OWNERS[kind as PermissionOwnerKind];
  if (!o || !isUuid(id)) throw fail('Not found', 404);
  return o;
}

/** Every page of a list endpoint (1000 per request). */
async function allPages(path: string, filters: Record<string, string> = {}): Promise<Raw[]> {
  const out: Raw[] = [];
  for (let page = 1; ; page++) {
    const res = await apiPaginated<Raw>(path, { page, per_page: 1000, ...filters });
    out.push(...res.data);
    if (page >= res.pagination.total_page) return out;
  }
}

export interface PermissionEditorData {
  owner: { id: string; name: string };
  permissions: PermissionRow[];
  /** permission id -> link id */
  assigned: Record<string, string>;
}

export async function loadPermissionEditor(auth: AuthState, kind: string, id: string): Promise<PermissionEditorData> {
  const o = owner(auth, kind, id);
  const [record, permissions, links] = await Promise.all([
    apiFetch<Raw>(`${o.api}/${enc(id)}`).then((r) => (r?.data ?? r) as Raw).catch(() => null),
    allPages('permission'),
    allPages(o.linkApi, { [o.linkField]: id }),
  ]);
  if (!record?.id) throw fail('Not found', 404);
  return {
    owner: { id: String(record.id), name: String(record.name ?? record.id) },
    permissions: permissions.map((p) => ({ id: String(p.id), name: String(p.name ?? ''), uri: p.uri ?? null })),
    // Only links of this owner, whatever the API's filter did.
    assigned: Object.fromEntries(links.filter((l) => l[o.linkField] === id).map((l) => [String(l.permission_id), String(l.id)])),
  };
}

/** Grant a permission; returns the new link id. */
export async function assignPermission(auth: AuthState, kind: string, id: string, permissionId: string): Promise<string> {
  const o = owner(auth, kind, id);
  if (!isUuid(permissionId)) throw fail('Not found', 404);
  const res = await apiFetch<Raw>(o.linkApi, { method: 'POST', body: { [o.linkField]: id, permission_id: permissionId } });
  const linkId = String(((res?.data ?? res) as Raw)?.id ?? '');
  if (!isUuid(linkId)) throw fail('The permission could not be assigned');
  return linkId;
}

/** Revoke a permission by its link id; the link must belong to this owner. */
export async function revokePermission(auth: AuthState, kind: string, id: string, linkId: string): Promise<void> {
  const o = owner(auth, kind, id);
  if (!isUuid(linkId)) throw fail('Not found', 404);
  const link = await apiFetch<Raw>(`${o.linkApi}/${enc(linkId)}`).then((r) => (r?.data ?? r) as Raw).catch(() => null);
  if (!link?.id || link[o.linkField] !== id) throw fail('Not found', 404);
  await apiFetch(`${o.linkApi}/${enc(linkId)}`, { method: 'DELETE' });
}
