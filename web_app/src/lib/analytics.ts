// Pure helpers for the analytics dashboards: headline numbers with their change since the previous
// period, and roll-ups of several study programs into one institution-wide series.
import type { LineData, Slice } from './unit-dashboard';

export interface Delta {
  latest: number;
  previous: number | null;
  /** latest - previous (null with no previous period). */
  change: number | null;
  /** Percentage change; null when there is no previous period or it was zero. */
  pct: number | null;
}

/** Latest value and how it moved since the period before it. Empty input -> null. */
export function deltaOf(values: number[]): Delta | null {
  if (values.length === 0) return null;
  const latest = values[values.length - 1];
  const previous = values.length > 1 ? values[values.length - 2] : null;
  const change = previous === null ? null : latest - previous;
  const pct = previous === null || previous === 0 ? null : ((latest - previous) / previous) * 100;
  return { latest, previous, change, pct };
}

/**
 * The API lists every future semester too (all zeros). Cut those off the end so charts end at the
 * last period with data and "latest" means the latest real period. Keeps at least one category.
 */
export function trimTrailingEmpty(line: LineData | null): LineData | null {
  if (!line) return null;
  let end = line.categories.length;
  while (end > 1 && line.series.every((s) => !(s.values[end - 1] > 0))) end--;
  return { categories: line.categories.slice(0, end), series: line.series.map((s) => ({ ...s, values: s.values.slice(0, end) })) };
}

/** null when no series has a value above zero anywhere (nothing worth drawing or reporting). */
export const withData = (line: LineData | null): LineData | null =>
  line && line.series.some((s) => s.values.some((v) => v > 0)) ? line : null;

/** "20251" -> "2025/1" (year + semester code of the Feeder period); anything else unchanged. */
export const periodLabel = (code: string | undefined) => (code && /^\d{5}$/.test(code) ? `${code.slice(0, 4)}/${code.slice(4)}` : (code ?? ''));

/** Periods with no data at all (0) are skipped so "previous" means the previous period that had something. */
export const nonZero = (values: number[]) => values.filter((v) => v > 0);

/** One number per category: every series added together (e.g. students of all statuses per year). */
export function totalsPerCategory(line: LineData | null): number[] {
  if (!line) return [];
  return line.categories.map((_, i) => line.series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
}

const sortedCategories = (lines: LineData[]) => [...new Set(lines.flatMap((l) => l.categories))].sort();

/** Add several programs' lines together, matching categories by label and series by name. */
export function sumLines(lines: (LineData | null)[]): LineData | null {
  const present = lines.filter((l): l is LineData => l !== null);
  if (present.length === 0) return null;
  const categories = sortedCategories(present);
  const names = [...new Set(present.flatMap((l) => l.series.map((s) => s.name)))];
  const series = names.map((name) => ({
    name,
    values: categories.map((c) =>
      present.reduce((sum, l) => {
        const i = l.categories.indexOf(c);
        const s = l.series.find((x) => x.name === name);
        return sum + (i >= 0 && s ? (s.values[i] ?? 0) : 0);
      }, 0),
    ),
  }));
  return { categories, series };
}

/**
 * Average of single-series lines per category (e.g. mean GPA). Programs without a value for a
 * category (or with 0, meaning "no data") do not drag the mean down.
 */
export function meanLine(lines: (LineData | null)[], name: string): LineData | null {
  const present = lines.filter((l): l is LineData => l !== null && l.series.length > 0);
  if (present.length === 0) return null;
  const categories = sortedCategories(present);
  const values = categories.map((c) => {
    const vs = present.map((l) => l.series[0].values[l.categories.indexOf(c)]).filter((v): v is number => typeof v === 'number' && v > 0);
    return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : 0;
  });
  return { categories, series: [{ name, values }] };
}

/** Add slices with the same name together, largest first. */
export function sumSlices(groups: Slice[][]): Slice[] {
  const map = new Map<string, number>();
  for (const g of groups) for (const s of g) map.set(s.name, (map.get(s.name) ?? 0) + s.value);
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/** Each row's share of the total, in percent. */
export function withShare<T extends { value: number }>(rows: T[]): (T & { pct: number })[] {
  const total = rows.reduce((s, r) => s + r.value, 0);
  return rows.map((r) => ({ ...r, pct: total > 0 ? (r.value / total) * 100 : 0 }));
}

/** The first `keep` rows plus one summed "others" row (a doughnut of 15 programs is unreadable). */
export function withOthers(rows: Slice[], keep: number, othersLabel: string): Slice[] {
  if (rows.length <= keep) return rows;
  const rest = rows.slice(keep).reduce((s, r) => s + r.value, 0);
  return rest > 0 ? [...rows.slice(0, keep), { name: othersLabel, value: rest }] : rows.slice(0, keep);
}
