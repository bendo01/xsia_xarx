import { describe, expect, it } from 'vitest';

import { creditTrend, distinctYears, filterTeaches, progressPercent, summarize } from './lecturer-teach';
import type { AssignedTeach } from './lecturer-types';

const mk = (o: Partial<AssignedTeach>): AssignedTeach => ({
  teach_lecturer_id: 'tl', teach_id: 't', lecturer_id: 'l', planning: 16, realization: 4, credit: 3,
  is_lecturer_home_base: false, course_id: 'c', class_code_id: 'cc', ...o,
});
const items = [
  mk({ course_name: 'Algebra', academic_year_id: 'y1', academic_year_code: 20231, academic_year_name: '2023/2024 Ganjil' }),
  mk({ course_name: 'Biology', credit: 0, course_total_credit: 2, academic_year_id: 'y2', academic_year_code: 20232, academic_year_name: '2023/2024 Genap' }),
  mk({ course_name: 'Chemistry', academic_year_id: 'y2', academic_year_code: 20232, academic_year_name: '2023/2024 Genap', realization: 20 }),
];

describe('lecturer-teach', () => {
  it('lists years latest first', () => {
    expect(distinctYears(items, 'Year').map((y) => y.id)).toEqual(['y2', 'y1']);
  });
  it('filters by text and year, latest year first', () => {
    expect(filterTeaches(items, '', 'all').map((a) => a.course_name)).toEqual(['Biology', 'Chemistry', 'Algebra']);
    expect(filterTeaches(items, 'alg', 'all')).toHaveLength(1);
    expect(filterTeaches(items, '', 'y2')).toHaveLength(2);
  });
  it('sums credits falling back to the course credit', () => {
    expect(summarize(items)).toEqual({ classes: 3, credits: 8, planned: 48, realized: 28 });
  });
  it('caps progress at 100 and handles no plan', () => {
    expect(progressPercent({ planning: 16, realization: 20 })).toBe(100);
    expect(progressPercent({ planning: 0, realization: 3 })).toBe(0);
  });
  it('builds the trend oldest first', () => {
    expect(creditTrend(items, 'Year').map((y) => [y.yearId, y.credits, y.classes])).toEqual([['y1', 3, 1], ['y2', 5, 2]]);
  });
});
