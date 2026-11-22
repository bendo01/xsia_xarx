type ParamValue = string | string[] | undefined;

/**
 * A query string ("?a=1&b=2", or "") built from the current search params plus
 * changes; `null`/`undefined`/"" removes a key. Used for pagination and filter
 * links that must keep the rest of the query intact.
 */
export function withParams(
  current: Record<string, ParamValue>,
  patch: Record<string, string | number | null | undefined>,
): string {
  const merged = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val) merged.set(k, val);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || v === '') merged.delete(k);
    else merged.set(k, String(v));
  }
  const s = merged.toString();
  return s ? `?${s}` : '?';
}

/** A positive integer page from a query value; anything else is page 1. */
export function parsePage(v: ParamValue): number {
  const n = Number.parseInt(Array.isArray(v) ? (v[0] ?? '') : (v ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100_000) : 1;
}

/** The page sizes a list may offer. */
export const PAGE_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

/** A page size from a query value (or number); only the offered sizes are accepted, anything else is the default. */
export function parsePageSize(v: ParamValue | number): number {
  const n = typeof v === 'number' ? v : Number.parseInt(Array.isArray(v) ? (v[0] ?? '') : (v ?? ''), 10);
  return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
}
