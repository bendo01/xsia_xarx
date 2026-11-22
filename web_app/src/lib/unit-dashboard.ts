// The unit dashboard endpoint returns ready-made ECharts options. We only need their data,
// so these adapters pull categories/series/slices out of them for our own SVG/HTML charts.
type Raw = Record<string, any>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : Number(v) || 0);

export interface LineData {
  categories: string[];
  series: { name: string; values: number[] }[];
}

/** `{xAxis:{data}, series:[{name,data}]}` -> categories + series; null when there is nothing to draw. */
export function lineFromOption(opt: unknown): LineData | null {
  const o = (opt ?? {}) as Raw;
  const categories = Array.isArray(o.xAxis?.data) ? (o.xAxis.data as unknown[]).map(String) : [];
  const series = (Array.isArray(o.series) ? (o.series as Raw[]) : [])
    .filter((s) => Array.isArray(s.data))
    .map((s) => ({ name: String(s.name ?? ''), values: (s.data as unknown[]).map(num) }));
  return categories.length > 0 && series.length > 0 ? { categories, series } : null;
}

export interface Slice {
  name: string;
  value: number;
}

/** Pie option -> slices, largest first, zero slices dropped. */
export function slicesFromOption(opt: unknown): Slice[] {
  const data = ((opt ?? {}) as Raw).series?.[0]?.data;
  if (!Array.isArray(data)) return [];
  return (data as Raw[])
    .map((d) => ({ name: String(d?.name ?? ''), value: num(d?.value) }))
    .filter((s) => s.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/**
 * Dataset-style bar option (`dataset.source` = [[header...], [amount, label], ...]; the encode
 * names say which column is which) -> label/value rows, largest first.
 */
export function rowsFromDataset(opt: unknown): Slice[] {
  const o = (opt ?? {}) as Raw;
  const src = o.dataset?.source;
  if (!Array.isArray(src) || src.length < 2) return [];
  const header = (src[0] as unknown[]).map(String);
  const enc = (o.series?.[0]?.encode ?? {}) as Raw;
  const vi = Math.max(0, header.indexOf(String(enc.x ?? 'amount')));
  let li = header.indexOf(String(enc.y ?? 'product'));
  // The API's encode names do not always match its header (it sends ["total","regency"] with
  // x="amount", y="product"): then the label is simply the other column.
  if (li < 0 || li === vi) li = header.length > 1 ? (vi === 0 ? 1 : 0) : 0;
  return (src.slice(1) as unknown[][])
    .map((r) => ({ name: String(r[li] ?? ''), value: num(r[vi]) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}
