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

describe('schedule columns', () => {
  it('read weekday and room names from the context and show a dash when unknown', async () => {
    const { CHILD_COLUMNS } = await import('./crud-views');
    const row = { weekday_id: 'w1', room_id: 'r1', start_hour: '08:00:00', end_hour: '09:40:00' };
    const ctx = { weekday: { w1: 'Senin' }, room: { r1: 'R-101' } };
    expect(CHILD_COLUMNS.teachSchedule.map((c) => c.cell(row, ctx))).toEqual(['Senin', '08:00 – 09:40', 'R-101', '-']);
    expect(CHILD_COLUMNS.teachSchedule[0].cell(row)).toBe('-');
    // a stray weekday id (saved before weekdays existed) is called out, not hidden
    const stray = { ...row, weekday_id: 'old-id' };
    expect(CHILD_COLUMNS.teachSchedule[0].cell(stray, { ...ctx, _text: { unknownWeekday: '⚠ Day not set' } })).toBe('⚠ Day not set');
    expect(CHILD_COLUMNS.teachSchedule[0].cell({ ...row, weekday_id: '' }, { ...ctx, _text: { unknownWeekday: '⚠ x' } })).toBe('⚠ x');
  });
});
