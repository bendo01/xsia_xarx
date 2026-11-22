import { describe, expect, it } from 'vitest';

import { withOthers, withData, deltaOf, meanLine, periodLabel, trimTrailingEmpty, sumLines, sumSlices, totalsPerCategory, withShare } from './analytics';

const line = (categories: string[], ...series: [string, number[]][]) => ({ categories, series: series.map(([name, values]) => ({ name, values })) });

describe('analytics helpers', () => {
  it('deltaOf compares the latest with the previous period', () => {
    expect(deltaOf([])).toBeNull();
    expect(deltaOf([5])).toEqual({ latest: 5, previous: null, change: null, pct: null });
    expect(deltaOf([100, 125])).toEqual({ latest: 125, previous: 100, change: 25, pct: 25 });
    expect(deltaOf([0, 4])?.pct).toBeNull();
    expect(deltaOf([10, 5])?.pct).toBe(-50);
  });
  it('totalsPerCategory adds the series', () => {
    expect(totalsPerCategory(line(['a', 'b'], ['x', [1, 2]], ['y', [3, 4]]))).toEqual([4, 6]);
    expect(totalsPerCategory(null)).toEqual([]);
  });
  it('sumLines matches categories by label and series by name', () => {
    const merged = sumLines([line(['2023', '2024'], ['L', [1, 2]]), line(['2024', '2025'], ['L', [10, 20]], ['P', [5, 6]]), null]);
    expect(merged?.categories).toEqual(['2023', '2024', '2025']);
    expect(merged?.series).toEqual([
      { name: 'L', values: [1, 12, 20] },
      { name: 'P', values: [0, 5, 6] },
    ]);
    expect(sumLines([null])).toBeNull();
  });
  it('meanLine ignores missing and zero values', () => {
    const m = meanLine([line(['a', 'b'], ['gpa', [3, 0]]), line(['a', 'b'], ['gpa', [4, 2]]), null], 'IPK');
    expect(m?.series[0]).toEqual({ name: 'IPK', values: [3.5, 2] });
  });
  it('sumSlices merges by name, largest first', () => {
    expect(sumSlices([[{ name: 'a', value: 1 }, { name: 'b', value: 5 }], [{ name: 'a', value: 7 }]])).toEqual([
      { name: 'a', value: 8 },
      { name: 'b', value: 5 },
    ]);
  });
  it('withShare gives percentages', () => {
    expect(withShare([{ value: 1 }, { value: 3 }]).map((r) => r.pct)).toEqual([25, 75]);
    expect(withShare([{ value: 0 }])[0].pct).toBe(0);
  });
  it('trimTrailingEmpty drops the all-zero tail but keeps inner gaps', () => {
    const t = trimTrailingEmpty(line(['a', 'b', 'c', 'd'], ['x', [1, 0, 2, 0]], ['y', [0, 0, 3, 0]]));
    expect(t?.categories).toEqual(['a', 'b', 'c']);
    expect(t?.series[0].values).toEqual([1, 0, 2]);
    expect(trimTrailingEmpty(line(['a', 'b'], ['x', [0, 0]]))?.categories).toEqual(['a']);
    expect(trimTrailingEmpty(null)).toBeNull();
  });
  it('periodLabel formats Feeder period codes', () => {
    expect(periodLabel('20251')).toBe('2025/1');
    expect(periodLabel('2023/2024 Ganjil')).toBe('2023/2024 Ganjil');
    expect(periodLabel(undefined)).toBe('');
  });
  it('withData is null for an all-zero line', () => {
    expect(withData(line(['a'], ['x', [0]]))).toBeNull();
    expect(withData(line(['a', 'b'], ['x', [0, 2]]))?.categories).toEqual(['a', 'b']);
    expect(withData(null)).toBeNull();
  });
  it('withOthers keeps the top rows and sums the rest', () => {
    const rows = [{ name: 'a', value: 5 }, { name: 'b', value: 3 }, { name: 'c', value: 2 }, { name: 'd', value: 1 }];
    expect(withOthers(rows, 2, 'Other')).toEqual([{ name: 'a', value: 5 }, { name: 'b', value: 3 }, { name: 'Other', value: 3 }]);
    expect(withOthers(rows, 4, 'Other')).toEqual(rows);
  });
});
