import { describe, expect, it } from 'vitest';

import { completionPercent, normaliseTrends } from './lecturer-profile';

describe('normaliseTrends', () => {
  it('reads camelCase, sorts oldest first and keeps courses', () => {
    const t = normaliseTrends([
      { yearId: 'b', yearName: '2024/2025', totalCredit: 12, classCount: 4, totalPlannedSessions: 64, totalRealizedSessions: 60, courses: [{ name: 'Biologi', code: 'B1', credit: 3 }] },
      { yearId: 'a', yearName: '2023/2024', totalCredit: 9, classCount: 3, totalPlannedSessions: 48, totalRealizedSessions: 48, courses: [] },
    ]);
    expect(t.map((x) => x.yearName)).toEqual(['2023/2024', '2024/2025']);
    expect(t[1]).toMatchObject({ totalCredit: 12, classCount: 4, plannedSessions: 64, realizedSessions: 60, courses: [{ name: 'Biologi', code: 'B1', credit: 3 }] });
  });
  it('accepts snake_case aliases and an envelope', () => {
    expect(normaliseTrends({ data: [{ year_id: 'x', year_name: 'Y', total_credit: 5, class_count: 2, total_planned_sessions: 10, total_realized_sessions: 5 }] })[0]).toMatchObject({ yearId: 'x', totalCredit: 5, plannedSessions: 10 });
  });
  it('turns junk into an empty list or zeros', () => {
    expect(normaliseTrends(null)).toEqual([]);
    expect(normaliseTrends([null, 3, { yearName: 'Z', totalCredit: 'x' }])).toEqual([{ yearId: '', yearName: 'Z', totalCredit: 0, classCount: 0, plannedSessions: 0, realizedSessions: 0, courses: [] }]);
  });
});

describe('completionPercent', () => {
  it('is whole percent of planned sessions held, capped at 100', () => {
    expect(completionPercent(64, 60)).toBe(94);
    expect(completionPercent(10, 12)).toBe(100);
    expect(completionPercent(0, 5)).toBeNull();
  });
});

import { parseLectureChart } from './lecturer-profile';

describe('parseLectureChart', () => {
  it('reads labels and counts from the chart option', () => {
    expect(parseLectureChart({ xAxis: { type: 'category', data: ['2023/2024', '2024/2025'] }, series: [{ type: 'line', data: [3, 5] }] })).toEqual({ categories: ['2023/2024', '2024/2025'], values: [3, 5] });
  });
  it('accepts an axis array and cuts to the shorter list', () => {
    expect(parseLectureChart({ xAxis: [{ data: ['a', 'b', 'c'] }], series: [{ data: [1, 2] }] })).toEqual({ categories: ['a', 'b'], values: [1, 2] });
  });
  it('turns junk into an empty chart and bad counts into zero', () => {
    expect(parseLectureChart(null)).toEqual({ categories: [], values: [] });
    expect(parseLectureChart({ xAxis: { data: ['a'] }, series: [{ data: ['x'] }] })).toEqual({ categories: ['a'], values: [0] });
  });
});
