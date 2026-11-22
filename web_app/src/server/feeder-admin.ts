// Administrator access to the Feeder (PDDikti) tables: paged lists and details of every table,
// and create/edit/delete for the reference tables. Table shapes are not declared anywhere, so the
// editable fields come from a sample row of the table itself.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { redact } from './admin-crud';
import type { WriteResult } from './institution-write';
import { FEEDER_GROUPS, FEEDER_WRITABLE, feederApiPath, inferFeederFields, parseFeederForm, type FeederGroup } from '../lib/feeder-admin';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));
const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;

function table(auth: AuthState, group: FeederGroup, slug: string, write = false): string {
  requireAdministrator(auth);
  if (!FEEDER_GROUPS[group]?.includes(slug) || (write && !FEEDER_WRITABLE.includes(group))) throw fail('Not found', 404);
  return feederApiPath(group, slug);
}

export async function listFeeder(auth: AuthState, group: FeederGroup, slug: string, page: number, pageSize: number) {
  const res = await apiPaginated<Raw>(table(auth, group, slug), { page, per_page: pageSize });
  return { ...res, data: res.data.map(redact) };
}

export async function loadFeederRecord(auth: AuthState, group: FeederGroup, slug: string, id: string): Promise<Raw> {
  const api = table(auth, group, slug);
  if (!isUuid(id)) throw fail('Not found', 404);
  const record = await apiFetch<Raw>(`${api}/${enc(id)}`).then(body).catch(() => null);
  if (!record?.id) throw fail('Not found', 404);
  return redact(record);
}

/** The editable fields of a reference table (from its first row) and, on edit, the record. */
export async function loadFeederForm(auth: AuthState, slug: string, id: string) {
  const api = table(auth, 'referensi', slug, true);
  if (id && !isUuid(id)) throw fail('Not found', 404);
  const [sample, record] = await Promise.all([
    apiPaginated<Raw>(api, { page: 1, per_page: 1 }).then((r) => r.data[0]).catch(() => undefined),
    id ? apiFetch<Raw>(`${api}/${enc(id)}`).then(body).catch(() => null) : Promise.resolve(null),
  ]);
  if (id && !record?.id) throw fail('Not found', 404);
  return { fields: inferFeederFields(record ?? sample), record };
}

export async function saveFeederRecord(auth: AuthState, slug: string, id: string | null, input: Raw): Promise<WriteResult> {
  const api = table(auth, 'referensi', slug, true);
  if (id && !isUuid(id)) throw fail('Not found', 404);
  const { fields } = await loadFeederForm(auth, slug, id ?? '');
  if (!fields.length) throw fail('No fields known for this table', 422);
  const parsed = parseFeederForm(fields, input);
  if (!parsed.ok) return parsed;
  if (id) {
    await apiFetch(`${api}/${enc(id)}`, { method: 'PUT', body: parsed.body });
    return { ok: true, id };
  }
  const created = await apiFetch<Raw>(api, { method: 'POST', body: parsed.body });
  return { ok: true, id: String(body(created)?.id ?? '') };
}

export async function removeFeederRecord(auth: AuthState, slug: string, id: string): Promise<void> {
  const api = table(auth, 'referensi', slug, true);
  if (!isUuid(id)) throw fail('Not found', 404);
  await apiFetch(`${api}/${enc(id)}`, { method: 'DELETE' });
}
