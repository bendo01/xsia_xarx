// Field rules for the rectorat's writes (staff appointments and employees). Shared by the form
// (early feedback) and the server (the last word).
import { STAFF_FIELDS, parseForm, type FieldSpec, type ParseResult, type Raw } from './crud-schema';

export const STAFF_WRITE_FIELDS: FieldSpec[] = [...STAFF_FIELDS, { name: 'unit_id', kind: 'uuid', required: true }];

export const EMPLOYEE_FIELDS: FieldSpec[] = [
  { name: 'code', kind: 'text', required: true, max: 50 },
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'individual_id', kind: 'uuid', required: true },
  { name: 'decree_number', kind: 'text', max: 100 },
  { name: 'decree_date', kind: 'date' },
  { name: 'is_active', kind: 'bool' },
];

export type InstitutionWriteKey = 'staff' | 'employee';

export const parseInstitutionWrite = (key: InstitutionWriteKey, input: Raw): ParseResult =>
  parseForm(key === 'staff' ? STAFF_WRITE_FIELDS : EMPLOYEE_FIELDS, input);
