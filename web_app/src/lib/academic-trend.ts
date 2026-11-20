// Per-semester GPA / credit trend for the student home charts. A faithful port
// of the old page's derivation: semesters are put in calendar order, the API's
// own per-semester fields are the fallback, and when the course rows of a
// semester are known they win (credit-weighted grade points, running totals).
import type { ActivityItem } from './student-types';

export interface DetailStat {
  activity_id: string;
  credit: number;
  grade_point: number | null;
}

export interface TrendPoint {
  id: string;
  /** Semester label from the API, or "" when it has none (the UI then numbers it). */
  label: string;
  /** Semester GPA (IPS). */
  ips: number;
  /** Cumulative GPA (IPK) up to and including this semester. */
  ipk: number;
  /** Credits taken this semester. */
  sks: number;
  /** Credits taken up to and including this semester. */
  totalSks: number;
}

const labelOf = (a: Pick<ActivityItem, 'academic_year' | 'name' | 'semester_name'>) =>
  a.academic_year?.name || a.name || a.semester_name || '';

/** "2011 / 1" -> "2011 / 2" -> "2012 / 1" ...; unparsable names fall back to creation time, then name. */
export function chronological<T extends Pick<ActivityItem, 'academic_year' | 'name' | 'semester_name'> & { created_at?: string }>(
  list: T[],
): T[] {
  return [...list].sort((a, b) => {
    const nameA = labelOf(a);
    const nameB = labelOf(b);
    const ma = nameA.match(/(\d{4})\s*[/-]?\s*(\d+)/);
    const mb = nameB.match(/(\d{4})\s*[/-]?\s*(\d+)/);
    if (ma && mb) {
      const [ya, sa, yb, sb] = [ma[1], ma[2], mb[1], mb[2]].map((n) => Number.parseInt(n, 10));
      if (ya !== yb) return ya - yb;
      if (sa !== sb) return sa - sb;
      // "2023/2024 Ganjil" and "2023/2024 Genap" parse identically (the "semester" is the
      // second year), so tell them apart by creation time, then by name (Ganjil < Genap).
    }
    if (a.created_at && b.created_at && a.created_at !== b.created_at) {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    }
    return nameA.localeCompare(nameB);
  });
}

interface SemesterStats {
  credits: number;
  gradedCredits: number;
  weighted: number;
  ips: number;
}

function statsByActivity(details: DetailStat[]): Map<string, SemesterStats> {
  const map = new Map<string, SemesterStats>();
  for (const d of details) {
    if (!d.activity_id) continue;
    const credit = Number(d.credit) || 0;
    const e = map.get(d.activity_id) ?? { credits: 0, gradedCredits: 0, weighted: 0, ips: 0 };
    e.credits += credit;
    if (d.grade_point != null && !Number.isNaN(Number(d.grade_point))) {
      e.gradedCredits += credit;
      e.weighted += Number(d.grade_point) * credit;
    }
    map.set(d.activity_id, e);
  }
  for (const e of map.values()) e.ips = e.gradedCredits > 0 ? e.weighted / e.gradedCredits : 0;
  return map;
}

const positive = (n: number | null | undefined): n is number => typeof n === 'number' && n > 0;

export function buildTrend(activities: ActivityItem[], details: DetailStat[] = []): TrendPoint[] {
  const stats = statsByActivity(details);
  let runCredits = 0;
  let runGraded = 0;
  let runWeighted = 0;

  return chronological(activities).map((a): TrendPoint => {
    const s = stats.get(a.id);
    const sks = positive(s?.credits) ? s.credits : positive(a.total_credit) ? a.total_credit : 0;
    const ips = positive(s?.ips) ? s.ips : positive(a.cumulative_index) ? a.cumulative_index : 0;
    const graded = positive(s?.gradedCredits) ? s.gradedCredits : sks;
    const weighted = positive(s?.weighted) ? s.weighted : ips * graded;

    runCredits += sks;
    runGraded += graded;
    runWeighted += weighted;
    const runningIpk = runGraded > 0 ? runWeighted / runGraded : ips;

    const totalSks = runCredits > 0
      ? runCredits
      : positive(a.grand_total_credit) && a.grand_total_credit !== a.total_credit
        ? a.grand_total_credit
        : sks;
    const ipk = runningIpk > 0
      ? runningIpk
      : positive(a.grand_cumulative_index) && Math.abs(a.grand_cumulative_index - (a.cumulative_index || 0)) > 0.001
        ? a.grand_cumulative_index
        : ips;

    return { id: a.id, label: labelOf(a), ips, ipk, sks, totalSks };
  });
}

/** A course row from the detail-activities endpoint -> the numbers the trend needs. */
export function toDetailStat(d: Record<string, any>): DetailStat {
  const credit = Number(d.credit ?? d.course?.total_credit ?? d.course?.credit ?? 0) || 0;
  const raw = d.grade_point ?? d.grade?.grade;
  const gp = raw != null && raw !== '' ? Number(raw) : null;
  return { activity_id: String(d.activity_id ?? ''), credit, grade_point: gp != null && !Number.isNaN(gp) ? gp : null };
}
