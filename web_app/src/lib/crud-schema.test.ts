import { describe, expect, it } from 'vitest';

import { CLASS_CODE_FIELDS, COURSE_FIELDS, CURRICULUM_FIELDS, parseForm, parseResource } from './crud-schema';

const V = '123e4567-e89b-42d3-a456-426614174011';
const course = { code: 'IF101', name: 'Algoritma', total_credit: '3', lecture_credit: '2', practice_credit: '1', field_practice_credit: '0', simulation_credit: '0', variety_id: V };

describe('parseForm', () => {
  it('coerces types, nulls blank optionals and ignores unknown fields', () => {
    const r = parseForm(COURSE_FIELDS, { ...course, has_unit: 'on', group_id: '', evil: 'x', unit_id: 'hijack' });
    expect(r).toEqual({
      ok: true,
      body: expect.objectContaining({
        code: 'IF101', total_credit: 3, has_unit: true, has_practice: false, group_id: null, start_date: null,
      }),
    });
    expect((r as any).body).not.toHaveProperty('evil');
    expect((r as any).body).not.toHaveProperty('unit_id');
  });
  it('reports required, invalid, too long and range errors by field', () => {
    const r = parseForm(COURSE_FIELDS, { ...course, code: ' ', name: 'x'.repeat(201), total_credit: '-1', lecture_credit: 'abc', variety_id: 'nope' });
    expect(r).toEqual({ ok: false, errors: { code: 'required', name: 'tooLong', total_credit: 'range', lecture_credit: 'invalid', variety_id: 'invalid' } });
  });
  it('accepts a decimal comma and rejects impossible dates', () => {
    expect((parseForm(COURSE_FIELDS, { ...course, total_credit: '1,5' }) as any).body.total_credit).toBe(1.5);
    expect(parseForm(COURSE_FIELDS, { ...course, start_date: '2024-02-30' })).toEqual({ ok: false, errors: { start_date: 'invalid' } });
  });
  it('requires end date not before start date', () => {
    expect(parseForm(CURRICULUM_FIELDS, { name: 'K', academic_year_id: V, curriculum_type_id: V, start_date: '2024-05-01', end_date: '2024-04-01' }))
      .toEqual({ ok: false, errors: { end_date: 'dateOrder' } });
    expect(parseForm(CURRICULUM_FIELDS, { name: 'K', academic_year_id: V, curriculum_type_id: V, start_date: '2024-05-01', end_date: '2024-05-01' }).ok).toBe(true);
  });
  it('class codes: integers only', () => {
    expect(parseForm(CLASS_CODE_FIELDS, { name: 'A', activity_id: V, capacity: '30.5' })).toEqual({ ok: false, errors: { capacity: 'invalid' } });
    expect((parseForm(CLASS_CODE_FIELDS, { name: 'A', activity_id: V, capacity: '30', code: '' }) as any).body).toMatchObject({ capacity: 30, code: null });
  });

  it('grade: minimum may not exceed maximum', () => {
    expect(parseResource('grade', { name: 'A', grade: '4', minimum: '90', maximum: '80' })).toEqual({ ok: false, errors: { maximum: 'range' } });
    expect(parseResource('grade', { name: 'A', grade: '4', minimum: '80', maximum: '100' }).ok).toBe(true);
  });
  it('activity: required counters and dates', () => {
    const V = '123e4567-e89b-42d3-a456-426614174011';
    const base = { name: 'Ganjil', academic_year_id: V, student_target: '100', candidate_number: '0', candidate_pass: '0', became_student: '0', transfer_student: '0' };
    expect(parseResource('activity', base).ok).toBe(true);
    expect(parseResource('activity', { ...base, student_target: '' })).toEqual({ ok: false, errors: { student_target: 'required' } });
  });
});
