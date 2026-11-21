import { describe, expect, it } from 'vitest';

import { FA_DEFS, FA_NAV, FA_ROUTE, idsToLookup, makeNames, nameOfRecord } from './final-assignment-defs';

const U1 = '123e4567-e89b-42d3-a456-426614174001';
const U2 = '123e4567-e89b-42d3-a456-426614174002';

describe('final-assignment definitions', () => {
  it('every list has columns, a route and a title', () => {
    for (const [kind, def] of Object.entries(FA_DEFS)) {
      expect(def.columns.length, kind).toBeGreaterThan(0);
      expect(FA_ROUTE[kind as keyof typeof FA_ROUTE], kind).toMatch(/^\/course-department\//);
      expect(def.titleKey).toBeTruthy();
    }
    expect(FA_NAV.every((k) => k in FA_DEFS)).toBe(true);
  });

  it('collects distinct, valid ids to look up per kind and ignores nil/junk', () => {
    const rows = [
      { student_id: U1, lecturer_id: U2, decree_id: '00000000-0000-0000-0000-000000000000' },
      { student_id: U1, lecturer_id: 'nope' },
    ];
    expect(idsToLookup(FA_DEFS.counsellor, rows)).toEqual({ student: [U1], lecturer: [U2] });
  });

  it('caps how many lookups one page may trigger', () => {
    const rows = Array.from({ length: 100 }, (_, i) => ({ student_id: `123e4567-e89b-42d3-a456-4266141740${String(i).padStart(2, '0')}` }));
    expect(idsToLookup(FA_DEFS.counsellor, rows, 10).student).toHaveLength(10);
  });

  it('turns ids into names and shows a dash for unknown ones', () => {
    const names = makeNames({ student: { [U1]: '2020 · Budi' } });
    const row = { student_id: U1, lecturer_id: U2, decree_id: U2 };
    expect(FA_DEFS.counsellor.columns.map((c) => c.cell(row, names))).toEqual(['2020 · Budi', '-', '-']);
  });

  it('formats dates, times and marks', () => {
    const names = makeNames({});
    const row = { schedule_date: '2024-05-06T00:00:00', schedule_time: '09:30:00' };
    expect(FA_DEFS.schedule.columns[2].cell(row, names)).toBe('2024-05-06 09:30');
    expect(FA_DEFS.evaluationSummary.columns[2].cell({ mark: 80.5 }, names)).toBe('80.5');
    expect(FA_DEFS.evaluationSummary.columns[2].cell({}, names)).toBe('-');
  });

  it('names records by kind', () => {
    expect(nameOfRecord('student', { code: '20', name: 'Budi' })).toBe('20 · Budi');
    expect(nameOfRecord('submission', { title: 'Skripsi' })).toBe('Skripsi');
    expect(nameOfRecord('stage', { name: 'Sidang' })).toBe('Sidang');
    expect(nameOfRecord('adviserDecree', { decree_number: 'SK/1' })).toBe('SK/1');
  });
});
