import { describe, expect, it } from 'vitest';

import { FORMS, toFormValues } from './crud-forms';
import { RESOURCES } from './crud-schema';

describe('crud forms', () => {
  it('every form field exists in its schema (and every non-bool schema field is editable)', () => {
    for (const key of Object.keys(FORMS) as (keyof typeof FORMS)[]) {
      const schema = new Set(RESOURCES[key].fields.map((f) => f.name));
      const form = new Set(FORMS[key].map((f) => f.name));
      for (const n of form) expect(schema.has(n), `${key}.${n}`).toBe(true);
      for (const n of schema) expect(form.has(n), `${key}.${n} missing from form`).toBe(true);
    }
  });
  it('maps a record to form values', () => {
    const v = toFormValues('curriculum', { name: 'K1', total_credit: 144, start_date: '2024-01-02T00:00:00', is_active: false, academic_year_id: null });
    expect(v).toMatchObject({ name: 'K1', total_credit: '144', start_date: '2024-01-02', is_active: false, academic_year_id: '' });
  });
  it('gives defaults for a new record', () => {
    expect(toFormValues('classCode', null)).toMatchObject({ code: '1', capacity: '0' });
  });
});
