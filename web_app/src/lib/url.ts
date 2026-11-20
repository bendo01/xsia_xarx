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
