// Pure helpers of the administrator's lecturer profile page.
export interface YearTrend {
  yearId: string;
  yearName: string;
  totalCredit: number;
  classCount: number;
  plannedSessions: number;
  realizedSessions: number;
  courses: { name: string; code: string; credit: number }[];
}

type Raw = Record<string, any>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const pick = (r: Raw, camel: string, snake: string) => r[camel] ?? r[snake];

/** The API's yearly credit trends (camelCase; snake_case aliases accepted), oldest year first. */
export function normaliseTrends(raw: unknown): YearTrend[] {
  const list = Array.isArray(raw) ? raw : Array.isArray((raw as Raw | null)?.data) ? (raw as Raw).data : [];
  return list
    .filter((r: unknown): r is Raw => r !== null && typeof r === 'object')
    .map((r: Raw) => ({
      yearId: String(pick(r, 'yearId', 'year_id') ?? ''),
      yearName: String(pick(r, 'yearName', 'year_name') ?? ''),
      totalCredit: num(pick(r, 'totalCredit', 'total_credit')),
      classCount: num(pick(r, 'classCount', 'class_count')),
      plannedSessions: num(pick(r, 'totalPlannedSessions', 'total_planned_sessions')),
      realizedSessions: num(pick(r, 'totalRealizedSessions', 'total_realized_sessions')),
      courses: (Array.isArray(r.courses) ? r.courses : []).filter((c: unknown) => c !== null && typeof c === 'object').map((c: Raw) => ({ name: String(c.name ?? ''), code: String(c.code ?? ''), credit: num(c.credit) })),
    }))
    .sort((a: YearTrend, b: YearTrend) => a.yearName.localeCompare(b.yearName));
}

/** Share of planned sessions that were held (0-100, whole numbers); null when none were planned. */
export function completionPercent(planned: number, realized: number): number | null {
  return planned > 0 ? Math.min(100, Math.round((realized / planned) * 100)) : null;
}

/** The lecturer's reference fields: field -> endpoint. */
export const LECTURER_REFERENCES: Record<string, string> = {
  status_id: 'academic/lecturer/reference/statuses',
  contract_id: 'academic/lecturer/reference/contracts',
  rank_id: 'academic/lecturer/reference/ranks',
  group_id: 'academic/lecturer/reference/groups',
  institution_id: 'institution/master/institutions',
};

/** Classes taught per academic year, from the API's chart-option JSON (`xAxis.data` labels, `series[0].data` counts). */
export function parseLectureChart(raw: unknown): { categories: string[]; values: number[] } {
  const r = (raw ?? {}) as Record<string, any>;
  const axis = Array.isArray(r.xAxis) ? r.xAxis[0] : r.xAxis;
  const labels: unknown[] = Array.isArray(axis?.data) ? axis.data : [];
  const series: unknown[] = Array.isArray(r.series) && Array.isArray(r.series[0]?.data) ? r.series[0].data : [];
  const n = Math.min(labels.length, series.length);
  return {
    categories: labels.slice(0, n).map(String),
    values: series.slice(0, n).map((v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)),
  };
}
