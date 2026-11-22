// Generic administrator CRUD over the registry in lib/admin-resources.ts. The API gives the role
// DataScope::All; this layer makes sure the caller is an administrator and that only registered
// resources and their whitelisted fields are touched.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import type { WriteResult } from './institution-write';
import { FK_SOURCES, RELATED } from '../lib/admin-related';
import { ADMIN_RESOURCES, adminUrl, findAdminResourceByKey, optionApi, parseAdminForm, parseSort, type AdminResource } from '../lib/admin-resources';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));
/** Credentials never leave the server: password hashes, api keys and one-time tokens. */
const SECRET = /password|api_key|token|magic_link/i;
export function redact<T extends Raw>(row: T): T {
  return Object.fromEntries(Object.entries(row).filter(([k]) => !SECRET.test(k))) as T;
}
const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;

function resourceFor(auth: AuthState, key: string): AdminResource {
  requireAdministrator(auth);
  const r = findAdminResourceByKey(key);
  if (!r || r.readOnly) throw fail('Not found', 404);
  return r;
}

export async function listAdminRecords(auth: AuthState, key: string, page: number, search: string, pageSize: number, sort = '', dir = '') {
  requireAdministrator(auth);
  const r = findAdminResourceByKey(key);
  if (!r) throw fail('Not found', 404);
  const res = await apiPaginated<Raw>(r.api, { page, per_page: pageSize, search, ...parseSort(r, sort, dir) });
  return { ...res, data: res.data.map(redact) };
}

const labelOf = (o: Raw) => [o.code, o.name ?? o.title].filter((x) => x !== undefined && x !== null && x !== '').join(' · ') || String(o.id);

/** The display label of every id already chosen in a lookup field of the record being edited. */
async function lookupLabels(r: AdminResource, record: Raw | null): Promise<Record<string, string>> {
  if (!record) return {};
  const pairs = await Promise.all(
    r.fields
      .filter((f) => f.input === 'lookup' && f.options && isUuid(String(record[f.name] ?? '')))
      .map(async (f) => {
        const api = optionApi(f.options!);
        const one = api ? await apiFetch<Raw>(`${api}/${enc(String(record[f.name]))}`).then(body).catch(() => null) : null;
        return [f.name, one?.id ? labelOf(one) : String(record[f.name])] as const;
      }),
  );
  return Object.fromEntries(pairs);
}

/** Search one of the resource's lookup sources by name (first 30 matches). */
export async function searchOptions(auth: AuthState, key: string, source: string, search: string): Promise<{ id: string; name: string }[]> {
  const r = resourceFor(auth, key);
  if (!r.fields.some((f) => f.input === 'lookup' && f.options === source)) throw fail('Not found', 404);
  const api = optionApi(source);
  if (!api || !search.trim()) return [];
  const res = await apiPaginated<Raw>(api, { page: 1, per_page: 30, search: search.trim() });
  return res.data.map((o) => ({ id: String(o.id), name: labelOf(o) }));
}

async function loadOptions(r: AdminResource): Promise<Record<string, { id: string; name: string }[]>> {
  const sources = [...new Set(r.fields.flatMap((f) => (f.input === 'select' && f.options ? [f.options] : [])))];
  const lists = await Promise.all(
    sources.map((s) =>
      apiPaginated<Raw>(optionApi(s) ?? '', { page: 1, per_page: 200 })
        .then((res) => res.data.map((o) => ({ id: String(o.id), name: labelOf(o) })))
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
  return { record: record ? redact(record) : null, options, labels: await lookupLabels(r, record) };
}

export async function saveAdminRecord(auth: AuthState, key: string, id: string | null, input: Raw): Promise<WriteResult> {
  const r = resourceFor(auth, key);
  if (!id && r.noCreate) throw fail('Not found', 404);
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

export interface RecordLink {
  label: string;
  /** The related record's own page, when it belongs to a registered resource. */
  href?: string;
}

export interface RelatedList {
  key: string;
  titleKey: string;
  /** All of its rows pointing here (the API's total when it honoured the filter, else what was returned). */
  total: number;
  listHref: string;
  columns: { field: string; label: string }[];
  rows: { id: string; href: string; cells: unknown[] }[];
}

/** The page a record of `resource` is shown on: its profile when it has one. */
const recordHref = (resource: AdminResource, id: string) => adminUrl(resource, id, ...(resource.hasProfile ? ['profile'] : []));

const MAX_LINKS = 14;
const RELATED_ROWS = 10;

/** Resolve the foreign keys of a record to readable names (and links to their pages). */
async function resolveLinks(r: AdminResource, record: Raw): Promise<Record<string, RecordLink>> {
  const fields = Object.keys(record).filter((f) => f.endsWith('_id') && isUuid(String(record[f] ?? ''))).slice(0, MAX_LINKS);
  const pairs = await Promise.all(
    fields.map(async (f) => {
      const source = r.fields.find((x) => x.name === f)?.options ?? FK_SOURCES[f];
      const api = source ? optionApi(source) : undefined;
      if (!api) return null;
      const id = String(record[f]);
      const one = await apiFetch<Raw>(`${api}/${enc(id)}`).then(body).catch(() => null);
      const target = ADMIN_RESOURCES.find((x) => x.key === source) ?? ADMIN_RESOURCES.find((x) => x.api === api);
      return [f, { label: one?.id ? labelOf(one) : id, href: target ? recordHref(target, id) : undefined }] as const;
    }),
  );
  return Object.fromEntries(pairs.filter((p): p is NonNullable<typeof p> => p !== null));
}

/** The lists of records that point at this one, as configured in lib/admin-related.ts. */
async function loadRelated(r: AdminResource, id: string): Promise<RelatedList[]> {
  const lists = await Promise.all(
    (RELATED[r.key] ?? []).map(async (spec): Promise<RelatedList | null> => {
      const target = findAdminResourceByKey(spec.key);
      if (!target) return null;
      try {
        const res = await apiPaginated<Raw>(target.api, { page: 1, per_page: RELATED_ROWS, [spec.field]: id });
        const mine = res.data.filter((x) => x[spec.field] === id).map(redact);
        // If the API ignored the filter, only the matching rows are trustworthy, and so is their count.
        const filtered = mine.length === res.data.length;
        const columns = target.columns.filter((c) => !c.field.endsWith('_id')).slice(0, 3);
        return {
          key: target.key,
          titleKey: target.titleKey,
          total: filtered ? res.pagination.total_data : mine.length,
          listHref: adminUrl(target),
          columns: columns.map((c) => ({ field: c.field, label: c.label })),
          rows: mine.map((x) => ({ id: String(x.id), href: recordHref(target, String(x.id)), cells: columns.map((c) => x[c.field]) })),
        };
      } catch {
        return null;
      }
    }),
  );
  return lists.filter((l): l is RelatedList => l !== null && l.rows.length > 0);
}

/** One record for the detail page (read-only resources included), with its relations resolved. */
export async function loadAdminRecord(auth: AuthState, key: string, id: string) {
  requireAdministrator(auth);
  const r = findAdminResourceByKey(key);
  if (!r || !isUuid(id)) throw fail('Not found', 404);
  const record = await apiFetch<Raw>(`${r.api}/${enc(id)}`).then(body).catch(() => null);
  if (!record?.id) throw fail('Not found', 404);
  const [links, related] = await Promise.all([resolveLinks(r, record), loadRelated(r, id)]);
  return { record: redact(record), links, related };
}
