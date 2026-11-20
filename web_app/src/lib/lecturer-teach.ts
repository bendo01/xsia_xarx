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
