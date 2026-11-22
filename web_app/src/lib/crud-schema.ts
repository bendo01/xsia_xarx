// Form schemas for the study-program CRUD pages. The same parse runs in the browser (instant
// feedback) and on the server (the authority): it whitelists fields, coerces types and returns
// error *codes* the UI translates. Pure, so it is tested without a DOM.
import { isUuid } from './validation';

export type FieldKind = 'text' | 'int' | 'number' | 'bool' | 'date' | 'datetime' | 'time' | 'uuid';

export interface FieldSpec {
  name: string;
  kind: FieldKind;
  required?: boolean;
  /** text: max length; int/number: inclusive maximum */
  max?: number;
  /** int/number: inclusive minimum */
  min?: number;
}

export type FieldError = 'required' | 'invalid' | 'tooLong' | 'range' | 'dateOrder' | 'timeOrder';
export type Raw = Record<string, unknown>;
export type ParseResult = { ok: true; body: Record<string, unknown> } | { ok: false; errors: Record<string, FieldError> };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isRealDate = (s: string) => DATE_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);
const blank = (v: unknown) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

function one(spec: FieldSpec, v: unknown): { value: unknown } | { error: FieldError } {
  if (spec.kind === 'bool') return { value: v === true || v === 'true' || v === 'on' || v === '1' };
  if (blank(v)) return spec.required ? { error: 'required' } : { value: null };
  const s = typeof v === 'string' ? v.trim() : v;
  switch (spec.kind) {
    case 'text': {
      if (typeof s !== 'string') return { error: 'invalid' };
      return s.length > (spec.max ?? 255) ? { error: 'tooLong' } : { value: s };
    }
    case 'uuid':
      return typeof s === 'string' && isUuid(s) ? { value: s } : { error: 'invalid' };
    case 'date':
      return typeof s === 'string' && isRealDate(s) ? { value: s } : { error: 'invalid' };
    case 'datetime': {
      // "YYYY-MM-DDTHH:MM[:SS]" from a datetime-local input or the API; the API wants seconds.
      const m = typeof s === 'string' ? /^(\d{4}-\d{2}-\d{2})[T ]([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?/.exec(s) : null;
      return m && isRealDate(m[1]) ? { value: `${m[1]}T${m[2]}:${m[3]}:${m[4] ?? '00'}` } : { error: 'invalid' };
    }
    case 'time': {
      // "HH:MM" from the browser or "HH:MM:SS" from the API; the API wants seconds.
      const m = typeof s === 'string' ? /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(s) : null;
      return m ? { value: `${m[1]}:${m[2]}:${m[3] ?? '00'}` } : { error: 'invalid' };
    }
    case 'int':
    case 'number': {
      const n = typeof s === 'number' ? s : Number(String(s).replace(',', '.'));
      if (!Number.isFinite(n) || (spec.kind === 'int' && !Number.isInteger(n))) return { error: 'invalid' };
      if (n < (spec.min ?? Number.NEGATIVE_INFINITY) || n > (spec.max ?? Number.POSITIVE_INFINITY)) return { error: 'range' };
      return { value: n };
    }
  }
}

/** Keeps only the schema's fields. A start/end date pair (`start_*`, `end_*`) must be in order. */
export function parseForm(fields: FieldSpec[], input: Raw): ParseResult {
  const body: Record<string, unknown> = {};
  const errors: Record<string, FieldError> = {};
  for (const f of fields) {
    const r = one(f, input[f.name]);
    if ('error' in r) errors[f.name] = r.error;
    else body[f.name] = r.value;
  }
  for (const f of fields) {
    const m = /^start_(.*)$/.exec(f.name);
    const end = m && `end_${m[1]}`;
    if (end && typeof body[f.name] === 'string' && typeof body[end] === 'string' && (body[end] as string) < (body[f.name] as string)) {
      errors[end] ??= 'dateOrder';
    }
  }
  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, body };
}

export const COURSE_FIELDS: FieldSpec[] = [
  { name: 'code', kind: 'text', required: true, max: 50 },
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'implementation_method', kind: 'text', max: 100 },
  { name: 'total_credit', kind: 'number', required: true, min: 0, max: 50 },
  { name: 'lecture_credit', kind: 'number', required: true, min: 0, max: 50 },
  { name: 'practice_credit', kind: 'number', required: true, min: 0, max: 50 },
  { name: 'field_practice_credit', kind: 'number', required: true, min: 0, max: 50 },
  { name: 'simulation_credit', kind: 'number', required: true, min: 0, max: 50 },
  { name: 'has_unit', kind: 'bool' },
  { name: 'has_syllabus', kind: 'bool' },
  { name: 'has_material', kind: 'bool' },
  { name: 'has_practice', kind: 'bool' },
  { name: 'has_dictation', kind: 'bool' },
  { name: 'variety_id', kind: 'uuid', required: true },
  { name: 'group_id', kind: 'uuid' },
  { name: 'competence_id', kind: 'uuid' },
  { name: 'start_date', kind: 'date' },
  { name: 'end_date', kind: 'date' },
];

export const CURRICULUM_FIELDS: FieldSpec[] = [
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'academic_year_id', kind: 'uuid', required: true },
  { name: 'curriculum_type_id', kind: 'uuid', required: true },
  { name: 'total_credit', kind: 'number', min: 0, max: 500 },
  { name: 'mandatory_course_credit', kind: 'number', min: 0, max: 500 },
  { name: 'optional_course_credit', kind: 'number', min: 0, max: 500 },
  { name: 'start_date', kind: 'date' },
  { name: 'end_date', kind: 'date' },
  { name: 'is_active', kind: 'bool' },
];

export const CLASS_CODE_FIELDS: FieldSpec[] = [
  { name: 'code', kind: 'int', min: 0, max: 100000 },
  { name: 'alphabet_code', kind: 'text', max: 10 },
  { name: 'name', kind: 'text', required: true, max: 100 },
  { name: 'activity_id', kind: 'uuid', required: true },
  { name: 'start_effective_date', kind: 'date' },
  { name: 'end_effective_date', kind: 'date' },
  { name: 'capacity', kind: 'int', min: 0, max: 100000 },
];

export const CURRICULUM_DETAIL_FIELDS: FieldSpec[] = [
  { name: 'semester_id', kind: 'uuid', required: true },
  { name: 'course_id', kind: 'uuid', required: true },
  { name: 'credit', kind: 'number', min: 0, max: 50 },
  { name: 'code', kind: 'int', min: 0, max: 100000 },
  { name: 'name', kind: 'text', max: 200 },
  { name: 'concentration_id', kind: 'uuid' },
  { name: 'is_convertable_to_mbkm', kind: 'bool' },
  { name: 'is_convertable_to_prior_learning_recognition', kind: 'bool' },
];

// NB: the API really spells it "decription".
export const LEARN_PLANNING_FIELDS: FieldSpec[] = [
  { name: 'code', kind: 'int', required: true, min: 1, max: 1000 },
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'decription_indonesian', kind: 'text', required: true, max: 4000 },
  { name: 'decription_english', kind: 'text', max: 4000 },
];

export const EVALUATION_PLANNING_FIELDS: FieldSpec[] = [
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'evaluation_type_id', kind: 'uuid', required: true },
  { name: 'percentage', kind: 'number', min: 0, max: 100 },
  { name: 'code', kind: 'int', min: 0, max: 1000 },
  { name: 'decription_indonesian', kind: 'text', required: true, max: 4000 },
  { name: 'decription_english', kind: 'text', max: 4000 },
];

export const ACTIVITY_FIELDS: FieldSpec[] = [
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'academic_year_id', kind: 'uuid', required: true },
  { name: 'week_quantity', kind: 'int', min: 0, max: 100 },
  { name: 'student_target', kind: 'int', required: true, min: 0, max: 100000 },
  { name: 'candidate_number', kind: 'int', required: true, min: 0, max: 100000 },
  { name: 'candidate_pass', kind: 'int', required: true, min: 0, max: 100000 },
  { name: 'became_student', kind: 'int', required: true, min: 0, max: 100000 },
  { name: 'transfer_student', kind: 'int', required: true, min: 0, max: 100000 },
  { name: 'total_class_member', kind: 'int', min: 0, max: 100000 },
  { name: 'start_date', kind: 'date' },
  { name: 'end_date', kind: 'date' },
  { name: 'start_transaction', kind: 'date' },
  { name: 'end_transaction', kind: 'date' },
  { name: 'is_active', kind: 'bool' },
];

export const GRADE_FIELDS: FieldSpec[] = [
  { name: 'code', kind: 'int', min: 0, max: 1000 },
  { name: 'alphabet_code', kind: 'text', max: 10 },
  { name: 'name', kind: 'text', required: true, max: 100 },
  { name: 'grade', kind: 'number', required: true, min: 0, max: 10 },
  { name: 'minimum', kind: 'number', required: true, min: 0, max: 100 },
  { name: 'maximum', kind: 'number', required: true, min: 0, max: 100 },
  { name: 'start_date', kind: 'date' },
  { name: 'end_date', kind: 'date' },
];

export const TEACH_SCHEDULE_FIELDS: FieldSpec[] = [
  { name: 'weekday_id', kind: 'uuid', required: true },
  { name: 'room_id', kind: 'uuid', required: true },
  { name: 'start_hour', kind: 'time', required: true },
  { name: 'end_hour', kind: 'time', required: true },
  { name: 'name', kind: 'text', max: 200 },
];

export type ResourceKey = TopKey | ChildKey;
export type TopKey = 'course' | 'curriculum' | 'classCode' | 'activity' | 'grade' | 'staff' | 'teach';
export type ChildKey = 'curriculumDetail' | 'learnPlanning' | 'evaluationPlanning' | 'teachDecree' | 'teachLecturer' | 'teachEvaluation' | 'teachSchedule';

export const STAFF_FIELDS: FieldSpec[] = [
  { name: 'employee_id', kind: 'uuid', required: true },
  { name: 'code', kind: 'text', max: 50 },
  { name: 'name', kind: 'text', max: 200 },
  { name: 'position_type_id', kind: 'uuid' },
  { name: 'decree_number', kind: 'text', max: 100 },
  { name: 'decree_date', kind: 'date' },
  { name: 'start_date', kind: 'date' },
  { name: 'end_date', kind: 'date' },
];

export const TEACH_FIELDS: FieldSpec[] = [
  { name: 'name', kind: 'text', max: 200 },
  { name: 'course_id', kind: 'uuid', required: true },
  { name: 'class_code_id', kind: 'uuid', required: true },
  { name: 'activity_id', kind: 'uuid' },
  { name: 'teach_decree_id', kind: 'uuid', required: true },
  { name: 'description', kind: 'text', max: 2000 },
  { name: 'start_date', kind: 'date' },
  { name: 'end_date', kind: 'date' },
  { name: 'practice_start_date', kind: 'date' },
  { name: 'practice_end_date', kind: 'date' },
  { name: 'max_member', kind: 'int', min: 0, max: 100000 },
  { name: 'curriculum_detail_id', kind: 'uuid' },
  { name: 'encounter_category_id', kind: 'uuid' },
  { name: 'scope_id', kind: 'uuid' },
  { name: 'is_lecturer_credit_sum_problem', kind: 'bool' },
];

export const TEACH_DECREE_FIELDS: FieldSpec[] = [
  { name: 'decree_number', kind: 'text', required: true, max: 100 },
  { name: 'decree_date', kind: 'date', required: true },
  { name: 'staff_id', kind: 'uuid' },
];

export const TEACH_LECTURER_FIELDS: FieldSpec[] = [
  { name: 'lecturer_id', kind: 'uuid', required: true },
  { name: 'name', kind: 'text', max: 200 },
  { name: 'planning', kind: 'int', required: true, min: 0, max: 200 },
  { name: 'realization', kind: 'int', required: true, min: 0, max: 200 },
  { name: 'credit', kind: 'number', min: 0, max: 50 },
  { name: 'is_lecturer_home_base', kind: 'bool' },
];

export const TEACH_EVALUATION_FIELDS: FieldSpec[] = [
  { name: 'thread', kind: 'int', min: 1, max: 50 },
  { name: 'name', kind: 'text', required: true, max: 200 },
  { name: 'english_name', kind: 'text', max: 200 },
  { name: 'evaluation_weight', kind: 'number', min: 0, max: 100 },
  { name: 'evaluation_type_id', kind: 'uuid' },
];

export interface ResourceDef {
  path: string;
  fields: FieldSpec[];
  /** Top-level records carry the unit themselves; children belong to a parent that does. */
  parent?: { field: string; resource: TopKey };
  /** Records without a unit of their own (teaching classes) belong to the unit through their course / class code / activity. */
  unitless?: boolean;
  /** Query parameter that carries search text on the list endpoint (default `name`). */
  searchParam?: string;
  /** Cross-field rules on the parsed body. */
  check?: (body: Record<string, unknown>) => Record<string, FieldError>;
}

export const RESOURCES: Record<ResourceKey, ResourceDef> = {
  course: { path: 'academic/course/master/courses', fields: COURSE_FIELDS, searchParam: 'search' },
  curriculum: { path: 'academic/course/master/curriculums', fields: CURRICULUM_FIELDS, searchParam: 'search' },
  classCode: { path: 'academic/campaign/transaction/class-codes', fields: CLASS_CODE_FIELDS },
  activity: { path: 'academic/campaign/transaction/activities', fields: ACTIVITY_FIELDS },
  grade: {
    path: 'academic/campaign/transaction/grades',
    fields: GRADE_FIELDS,
    check: (b): Record<string, FieldError> => (Number(b.minimum) > Number(b.maximum) ? { maximum: 'range' } : {}),
  },
  staff: { path: 'institution/master/staffes', fields: STAFF_FIELDS },
  teach: { path: 'academic/campaign/transaction/teaches', fields: TEACH_FIELDS, unitless: true },
  teachSchedule: {
    path: 'academic/campaign/transaction/schedules',
    fields: TEACH_SCHEDULE_FIELDS,
    parent: { field: 'teach_id', resource: 'teach' },
    check: (b): Record<string, FieldError> => (typeof b.start_hour === 'string' && typeof b.end_hour === 'string' && b.end_hour <= b.start_hour ? { end_hour: 'timeOrder' } : {}),
  },
  teachDecree: { path: 'academic/campaign/transaction/teach-decrees', fields: TEACH_DECREE_FIELDS, parent: { field: 'activity_id', resource: 'activity' } },
  teachLecturer: { path: 'academic/campaign/transaction/teach-lecturers', fields: TEACH_LECTURER_FIELDS, parent: { field: 'teach_id', resource: 'teach' } },
  teachEvaluation: { path: 'academic/campaign/transaction/teach-evaluations', fields: TEACH_EVALUATION_FIELDS, parent: { field: 'teach_id', resource: 'teach' } },
  curriculumDetail: { path: 'academic/course/master/curriculum-details', fields: CURRICULUM_DETAIL_FIELDS, parent: { field: 'curriculum_id', resource: 'curriculum' } },
  learnPlanning: { path: 'academic/course/master/course-learn-plannings', fields: LEARN_PLANNING_FIELDS, parent: { field: 'course_id', resource: 'course' } },
  evaluationPlanning: { path: 'academic/course/master/course-evaluation-plannings', fields: EVALUATION_PLANNING_FIELDS, parent: { field: 'course_id', resource: 'course' } },
};

/** Field rules of a resource plus its cross-field checks. */
export function parseResource(key: ResourceKey, input: Raw): ParseResult {
  const def = RESOURCES[key];
  const r = parseForm(def.fields, input);
  if (!r.ok) return r;
  const extra = def.check?.(r.body) ?? {};
  return Object.keys(extra).length > 0 ? { ok: false, errors: extra } : r;
}
