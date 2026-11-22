// Generic administrator CRUD over the registry in lib/admin-resources.ts. The API gives the role
// DataScope::All; this layer makes sure the caller is an administrator and that only registered
// resources and their whitelisted fields are touched.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import type { WriteResult } from './institution-write';
import { OPTION_SOURCES, findAdminResourceByKey, parseAdminForm, type AdminResource } from '../lib/admin-resources';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));
const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;

function resourceFor(auth: AuthState, key: string): AdminResource {
  requireAdministrator(auth);
  const r = findAdminResourceByKey(key);
  if (!r || r.readOnly) throw fail('Not found', 404);
  return r;
}

export async function listAdminRecords(auth: AuthState, key: string, page: number, search: string, pageSize: number) {
  requireAdministrator(auth);
  const r = findAdminResourceByKey(key);
  if (!r) throw fail('Not found', 404);
  return apiPaginated<Raw>(r.api, { page, per_page: pageSize, search });
}

async function loadOptions(r: AdminResource): Promise<Record<string, { id: string; name: string }[]>> {
  const sources = [...new Set(r.fields.flatMap((f) => (f.options ? [f.options] : [])))];
  const lists = await Promise.all(
    sources.map((s) =>
      apiPaginated<Raw>(OPTION_SOURCES[s], { page: 1, per_page: 200 })
        .then((res) => res.data.map((o) => ({ id: String(o.id), name: [o.code, o.name].filter((x) => x !== undefined && x !== null && x !== '').join(' · ') || String(o.id) })))
        .catch(() => []),
    ),
  );
  return Object.fromEntries(sources.map((s, i) => [s, lists[i]]));
}

/** What the form needs: the record (edit) and the option lists of its select fields. */
export async function loadAdminForm(auth: AuthState, key: string, id: string) {
  const r = resourceFor(auth, key);
  if (id && !isUuid(id)) throw fail('Not found', 404);
  const [record, options] = await Promise.all([
    id ? apiFetch<Raw>(`${r.api}/${enc(id)}`).then(body).catch(() => null) : Promise.resolve(null),
    loadOptions(r),
  ]);
  if (id && !record?.id) throw fail('Not found', 404);
  return { record, options };
}

export async function saveAdminRecord(auth: AuthState, key: string, id: string | null, input: Raw): Promise<WriteResult> {
  const r = resourceFor(auth, key);
  const parsed = parseAdminForm(r, input);
  if (!parsed.ok) return parsed;
  if (id) {
    if (!isUuid(id)) throw fail('Not found', 404);
    await apiFetch(`${r.api}/${enc(id)}`, { method: 'PUT', body: parsed.body });
    return { ok: true, id };
  }
  const created = await apiFetch<Raw>(r.api, { method: 'POST', body: parsed.body });
  return { ok: true, id: String(body(created)?.id ?? '') };
}

export async function removeAdminRecord(auth: AuthState, key: string, id: string): Promise<void> {
  const r = resourceFor(auth, key);
  if (!isUuid(id)) throw fail('Not found', 404);
  await apiFetch(`${r.api}/${enc(id)}`, { method: 'DELETE' });
}
