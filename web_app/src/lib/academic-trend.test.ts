import { describe, expect, it } from 'vitest';
import { buildTrend, chronological, toDetailStat } from './academic-trend';
import type { ActivityItem } from './student-types';

const act = (id: string, year: string, over: Partial<ActivityItem> = {}): ActivityItem => ({
  id, academic_year: { name: year }, cumulative_index: 0, grand_cumulative_index: 0, total_credit: 0, grand_total_credit: 0, is_lock: false, ...over,
});

describe('chronological', () => {
  it('orders by year then semester, whatever order the API returned', () => {
    const out = chronological([act('c', '2012 / 1'), act('a', '2011 / 1'), act('b', '2011 / 2'), act('d', '2013-2')]);
    expect(out.map((a) => a.id)).toEqual(['a', 'b', 'c', 'd']);
  });
  it('falls back to creation time, then name, for unparsable labels', () => {
    const a = { ...act('a', 'Semester Awal'), created_at: '2020-01-01' };
    const b = { ...act('b', 'Semester Akhir'), created_at: '2021-01-01' };
    expect(chronological([b, a]).map((x) => x.id)).toEqual(['a', 'b']);
    expect(chronological([act('z', 'Zeta'), act('y', 'Alpha')]).map((x) => x.id)).toEqual(['y', 'z']);
  });
  it('orders the two semesters of an academic year written "2023/2024 Ganjil|Genap"', () => {
    const out = chronological([act('genap', '2023/2024 Genap'), act('next', '2024/2025 Ganjil'), act('ganjil', '2023/2024 Ganjil')]);
    expect(out.map((a) => a.id)).toEqual(['ganjil', 'genap', 'next']);
  });
  it('prefers creation time over the name when the labels tie', () => {
    const a = { ...act('late', '2023/2024 Ganjil'), created_at: '2024-02-01' };
    const b = { ...act('early', '2023/2024 Ganjil'), created_at: '2023-09-01' };
    expect(chronological([a, b]).map((x) => x.id)).toEqual(['early', 'late']);
  });
  it('does not mutate its input', () => {
    const list = [act('b', '2012 / 1'), act('a', '2011 / 1')];
    chronological(list);
    expect(list.map((a) => a.id)).toEqual(['b', 'a']);
  });
});

describe('buildTrend from the API fields alone', () => {
  it('accumulates credits and carries the API indexes', () => {
    const t = buildTrend([
      act('s2', '2011 / 2', { total_credit: 22, cumulative_index: 3.5, grand_cumulative_index: 3.3 }),
      act('s1', '2011 / 1', { total_credit: 20, cumulative_index: 3.0, grand_cumulative_index: 3.0 }),
    ]);
    expect(t.map((p) => p.id)).toEqual(['s1', 's2']);
    expect(t.map((p) => p.sks)).toEqual([20, 22]);
    expect(t.map((p) => p.totalSks)).toEqual([20, 42]);
    expect(t[0].ips).toBe(3.0);
    // running IPK is credit-weighted from the semester indexes: (3.0*20 + 3.5*22) / 42
    expect(t[1].ipk).toBeCloseTo((3.0 * 20 + 3.5 * 22) / 42, 5);
  });

  it('keeps zeros for semesters with no data instead of failing', () => {
    const [p] = buildTrend([act('x', '2020 / 1')]);
    expect(p).toMatchObject({ ips: 0, ipk: 0, sks: 0, totalSks: 0 });
  });
});

describe('buildTrend with course rows', () => {
  it('prefers credit-weighted grade points from the semester courses', () => {
    const t = buildTrend(
      [act('s1', '2011 / 1', { total_credit: 99, cumulative_index: 1 })],
      [
        { activity_id: 's1', credit: 3, grade_point: 4 },
        { activity_id: 's1', credit: 2, grade_point: 3 },
        { activity_id: 's1', credit: 1, grade_point: null }, // ungraded: counts as credits, not in GPA
      ],
    );
    expect(t[0].sks).toBe(6); // from the rows, not the API's 99
    expect(t[0].ips).toBeCloseTo((3 * 4 + 2 * 3) / 5, 5);
  });

  it('carries running totals across semesters', () => {
    const t = buildTrend(
      [act('a', '2011 / 1'), act('b', '2011 / 2')],
      [
        { activity_id: 'a', credit: 4, grade_point: 4 },
        { activity_id: 'b', credit: 4, grade_point: 2 },
      ],
    );
    expect(t.map((p) => p.totalSks)).toEqual([4, 8]);
    expect(t[0].ipk).toBeCloseTo(4);
    expect(t[1].ipk).toBeCloseTo(3); // (4*4 + 2*4) / 8
  });

  it('uses the API grand totals only when there is nothing to accumulate', () => {
    const [p] = buildTrend([act('a', '2011 / 1', { total_credit: 0, grand_total_credit: 60, grand_cumulative_index: 3.8, cumulative_index: 0 })]);
    expect(p.totalSks).toBe(60);
    expect(p.ipk).toBe(3.8);
  });
});

describe('toDetailStat', () => {
  it('reads credit and grade point from the row or its embedded relations', () => {
    expect(toDetailStat({ activity_id: 'a', credit: 3, grade_point: 3.5 })).toEqual({ activity_id: 'a', credit: 3, grade_point: 3.5 });
    expect(toDetailStat({ activity_id: 'a', course: { total_credit: 2 }, grade: { grade: 4 } })).toEqual({ activity_id: 'a', credit: 2, grade_point: 4 });
  });
  it('treats missing or non-numeric grades as ungraded (not zero)', () => {
    expect(toDetailStat({ activity_id: 'a', credit: 3 }).grade_point).toBeNull();
    expect(toDetailStat({ activity_id: 'a', credit: 3, grade_point: 'x' }).grade_point).toBeNull();
    expect(toDetailStat({ activity_id: 'a', credit: 3, grade_point: 0 }).grade_point).toBe(0);
  });
});
