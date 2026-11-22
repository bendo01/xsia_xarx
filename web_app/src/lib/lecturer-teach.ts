// Pure helpers over a lecturer's assigned classes (filtering, ordering, summary, credit trend).
import type { AssignedTeach } from './lecturer-types';

export const creditOf = (a: AssignedTeach) => Number(a.credit || a.course_total_credit) || 0;

export interface YearOption {
  id: string;
  name: string;
  code: number | string | null;
}

/** Distinct academic years of the classes, latest first. */
export function distinctYears(items: AssignedTeach[], fallbackName: string): YearOption[] {
  const map = new Map<string, YearOption>();
  for (const a of items) {
    if (!a.academic_year_id || map.has(a.academic_year_id)) continue;
    map.set(a.academic_year_id, {
      id: a.academic_year_id,
      name: a.academic_year_name || (a.academic_year_code ? `${fallbackName} ${a.academic_year_code}` : fallbackName),
      code: a.academic_year_code ?? null,
    });
  }
  return [...map.values()].sort(
    (x, y) => (Number(y.code) || 0) - (Number(x.code) || 0) || x.name.localeCompare(y.name),
  );
}

/** Case-insensitive search over course/class/activity/year plus an optional year filter; latest year first. */
export function filterTeaches(items: AssignedTeach[], search: string, yearId: string): AssignedTeach[] {
  const q = search.toLowerCase().trim();
  const hay = (a: AssignedTeach) =>
    [a.course_name, a.course_code, a.class_name, a.class_alphabet_code, a.teach_name, a.activity_name, a.academic_year_name]
      .filter(Boolean)
      .join('\u0000')
      .toLowerCase();
  return items
    .filter((a) => (!q || hay(a).includes(q)) && (!yearId || yearId === 'all' || a.academic_year_id === yearId))
    .sort(
      (a, b) =>
        (Number(b.academic_year_code) || 0) - (Number(a.academic_year_code) || 0) ||
        (b.academic_year_name ?? '').localeCompare(a.academic_year_name ?? '') ||
        (a.course_name ?? '').localeCompare(b.course_name ?? ''),
    );
}

export const progressPercent = (a: Pick<AssignedTeach, 'planning' | 'realization'>) =>
  a.planning > 0 ? Math.min(100, Math.round((a.realization / a.planning) * 100)) : 0;

export function summarize(items: AssignedTeach[]) {
  return {
    classes: items.length,
    credits: items.reduce((s, a) => s + creditOf(a), 0),
    planned: items.reduce((s, a) => s + (Number(a.planning) || 0), 0),
    realized: items.reduce((s, a) => s + (Number(a.realization) || 0), 0),
  };
}

export interface YearTrend {
  yearId: string;
  yearName: string;
  yearCode: number;
  credits: number;
  classes: number;
}

/** Credits and class count per academic year, oldest first (left-to-right timeline). */
export function creditTrend(items: AssignedTeach[], fallbackName: string): YearTrend[] {
  const map = new Map<string, YearTrend>();
  for (const a of items) {
    if (!a.academic_year_id) continue;
    let e = map.get(a.academic_year_id);
    if (!e) {
      e = {
        yearId: a.academic_year_id,
        yearName: a.academic_year_name || (a.academic_year_code ? `${fallbackName} ${a.academic_year_code}` : fallbackName),
        yearCode: Number(a.academic_year_code) || 0,
        credits: 0,
        classes: 0,
      };
      map.set(a.academic_year_id, e);
    }
    e.credits += creditOf(a);
    e.classes += 1;
  }
  return [...map.values()].sort((x, y) => x.yearCode - y.yearCode || x.yearName.localeCompare(y.yearName));
}

export interface YearStats extends YearTrend {
  planned: number;
  realized: number;
}

/** Credits, classes and planned / realized sessions per academic year, oldest first. */
export function yearStats(items: AssignedTeach[], fallbackName: string): YearStats[] {
  const stats = new Map<string, YearStats>(creditTrend(items, fallbackName).map((y) => [y.yearId, { ...y, planned: 0, realized: 0 }]));
  for (const a of items) {
    const y = a.academic_year_id ? stats.get(a.academic_year_id) : undefined;
    if (!y) continue;
    y.planned += Number(a.planning) || 0;
    y.realized += Number(a.realization) || 0;
  }
  return [...stats.values()].sort((x, y) => x.yearCode - y.yearCode || x.yearName.localeCompare(y.yearName));
}

/** Share of the planned sessions that were held, in percent (capped at 100); null with no plan. */
export const completionRate = (planned: number, realized: number): number | null =>
  planned > 0 ? Math.min(100, Math.round((realized / planned) * 100)) : null;

/** How the classes split by credit weight ("3 SKS": 12 classes, "2 SKS": 4 classes ...), heaviest group first. */
export function creditSlices(items: AssignedTeach[], unit: string): { name: string; value: number }[] {
  const map = new Map<number, number>();
  for (const a of items) {
    const c = creditOf(a);
    if (c > 0) map.set(c, (map.get(c) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]).map(([c, value]) => ({ name: `${c} ${unit}`, value }));
}

/** The courses taught most often (classes over all years), for a ranking chart. */
export function courseSlices(items: AssignedTeach[], limit = 8): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const a of items) {
    const name = a.course_name?.trim();
    if (name) map.set(name, (map.get(name) ?? 0) + 1);
  }
  return [...map.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value || a.name.localeCompare(b.name)).slice(0, limit);
}
