import { describe, expect, it } from 'vitest';

import { CHILD_COLUMNS, COLUMNS, DETAIL } from './crud-views';

describe('crud views', () => {
  it('never throw on an empty record and show a dash', () => {
    for (const cols of [...Object.values(COLUMNS), ...Object.values(DETAIL), ...Object.values(CHILD_COLUMNS)]) {
      for (const c of cols) expect(c.cell({})).toBe('-');
    }
  });
  it('reads embedded relations or flat names', () => {
    expect(COLUMNS.course[3].cell({ variety: { name: 'Wajib' } })).toBe('Wajib');
    expect(COLUMNS.curriculum[1].cell({ academic_year_name: '2024' })).toBe('2024');
    expect(COLUMNS.classCode[3].cell({ start_effective_date: '2024-01-01T00:00:00', end_effective_date: null })).toBe('2024-01-01 – …');
  });
});
