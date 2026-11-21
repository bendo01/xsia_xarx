// Read-only adviser and final-assignment lists. The API scopes these rows to the caller's unit
// (DataScope), so no unit filter is sent; rows hold ids only, which are resolved to names with a
// bounded, de-duplicated batch of `show` calls per page.
import { apiFetch, apiPaginated } from './api';
import { FA_DEFS, LOOKUP_PATHS, idsToLookup, nameOfRecord, type FaKind, type LookupKind } from '../lib/final-assignment-defs';

type Raw = Record<string, any>;
const enc = encodeURIComponent;

export async function loadFaList(kind: FaKind, page: number, pageSize = 20) {
  const def = FA_DEFS[kind];
  const res = await apiPaginated<Raw>(def.path, { page, per_page: pageSize });

  const wanted = idsToLookup(def, res.data);
  const names: Partial<Record<LookupKind, Record<string, string>>> = {};
  await Promise.all(
    Object.entries(wanted).flatMap(([k, ids]) =>
      (ids ?? []).map(async (id) => {
        const kindKey = k as LookupKind;
        const raw = await apiFetch<Raw>(`${LOOKUP_PATHS[kindKey]}/${enc(id)}`).catch(() => null);
        const rec = ((raw?.data ?? raw) as Raw | null) ?? null;
        const name = rec ? nameOfRecord(kindKey, rec) : '';
        if (name) (names[kindKey] ??= {})[id] = name;
      }),
    ),
  );
  return { ...res, names };
}
