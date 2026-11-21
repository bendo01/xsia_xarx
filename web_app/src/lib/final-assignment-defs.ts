// The adviser and final-assignment lists of the study program (read-only). The API returns rows of
// ids; `lookups` say which ids are turned into names, and `cell` builds each column from the row plus
// those names. Pure, so it is tested without a DOM or an API.
export type FaKind =
  | 'counsellor'
  | 'adviserDecree'
  | 'adviser'
  | 'evaluationSummary'
  | 'decree'
  | 'prerequisite'
  | 'schedule'
  | 'submission';

/** What an id refers to, and where to read its name. */
export type LookupKind = 'student' | 'lecturer' | 'room' | 'stage' | 'approvalType' | 'category' | 'requirement' | 'adviserCategory' | 'submission' | 'staff' | 'adviserDecree';

export const LOOKUP_PATHS: Record<LookupKind, string> = {
  student: 'academic/student/master/students',
  lecturer: 'academic/lecturer/master/lecturers',
  room: 'building/master/rooms',
  stage: 'academic/student/final-assignment/reference/stages',
  approvalType: 'academic/student/final-assignment/reference/approval-types',
  category: 'academic/student/final-assignment/reference/categories',
  requirement: 'academic/student/final-assignment/reference/requirements',
  adviserCategory: 'academic/student/final-assignment/reference/adviser-categories',
  submission: 'academic/student/final-assignment/transaction/submissions',
  staff: 'institution/master/staffes',
  adviserDecree: 'academic/student/adviser/decrees',
};

type Rec = Record<string, any>;
export type Names = (kind: LookupKind, id: unknown) => string;

export interface FaColumn {
  label: string;
  cell: (r: Rec, n: Names) => string;
}

export interface FaDef {
  path: string;
  titleKey: string;
  /** row field -> what it refers to */
  lookups: Partial<Record<string, LookupKind>>;
  columns: FaColumn[];
}

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));
const day = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 10) : '-');
const time = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 5) : '-');

const STAGE: FaColumn = { label: 'cd.faStage', cell: (r, n) => n('stage', r.stage_id) };
const SUBMISSION: FaColumn = { label: 'cd.faSubmission', cell: (r, n) => n('submission', r.submission_id) };

export const FA_DEFS: Record<FaKind, FaDef> = {
  counsellor: {
    path: 'academic/student/adviser/counsellors',
    titleKey: 'menu.courseDepartment.adviserDirectory',
    lookups: { student_id: 'student', lecturer_id: 'lecturer', decree_id: 'adviserDecree' },
    columns: [
      { label: 'cd.mahasiswa', cell: (r, n) => n('student', r.student_id) },
      { label: 'cd.fLecturer', cell: (r, n) => n('lecturer', r.lecturer_id) },
      { label: 'cd.fDecreeNumber', cell: (r, n) => n('adviserDecree', r.decree_id) },
    ],
  },
  adviserDecree: {
    path: 'academic/student/adviser/decrees',
    titleKey: 'cd.faAdviserDecrees',
    lookups: { staff_id: 'staff' },
    columns: [
      { label: 'cd.fDecreeNumber', cell: (r) => dash(r.decree_number) },
      { label: 'cd.fDecreeDate', cell: (r) => day(r.decree_date) },
      { label: 'cd.fStaffMember', cell: (r, n) => n('staff', r.staff_id) },
    ],
  },
  submission: {
    path: 'academic/student/final-assignment/transaction/submissions',
    titleKey: 'cd.faSubmissions',
    lookups: { student_id: 'student', category_id: 'category', stage_id: 'stage', approval_type_id: 'approvalType' },
    columns: [
      { label: 'cd.faTitle', cell: (r) => dash(r.title) },
      { label: 'cd.mahasiswa', cell: (r, n) => n('student', r.student_id) },
      { label: 'cd.faCategory', cell: (r, n) => n('category', r.category_id) },
      STAGE,
      { label: 'cd.faApproval', cell: (r, n) => n('approvalType', r.approval_type_id) },
    ],
  },
  adviser: {
    path: 'academic/student/final-assignment/transaction/advisers',
    titleKey: 'cd.faAdvisers',
    lookups: { lecturer_id: 'lecturer', submission_id: 'submission', adviser_category_id: 'adviserCategory' },
    columns: [
      SUBMISSION,
      { label: 'cd.fLecturer', cell: (r, n) => n('lecturer', r.lecturer_id) },
      { label: 'cd.faAdviserCategory', cell: (r, n) => n('adviserCategory', r.adviser_category_id) },
      { label: 'cd.fThread', cell: (r) => dash(r.thread) },
    ],
  },
  evaluationSummary: {
    path: 'academic/student/final-assignment/transaction/evaluation-summaries',
    titleKey: 'cd.faEvaluationSummaries',
    lookups: { submission_id: 'submission', stage_id: 'stage' },
    columns: [SUBMISSION, STAGE, { label: 'lc.nilaiAkhir', cell: (r) => dash(r.mark) }],
  },
  decree: {
    path: 'academic/student/final-assignment/transaction/final-assignment-decrees',
    titleKey: 'cd.faDecrees',
    lookups: { staff_id: 'staff' },
    columns: [
      { label: 'cd.fDecreeNumber', cell: (r) => dash(r.decree_number) },
      { label: 'cd.fDecreeDate', cell: (r) => day(r.decree_date) },
      { label: 'cd.fStaffMember', cell: (r, n) => n('staff', r.staff_id) },
    ],
  },
  prerequisite: {
    path: 'academic/student/final-assignment/transaction/prerequisites',
    titleKey: 'cd.faPrerequisites',
    lookups: { submission_id: 'submission', requirement_id: 'requirement', approval_type_id: 'approvalType', stage_id: 'stage' },
    columns: [
      SUBMISSION,
      { label: 'cd.faRequirement', cell: (r, n) => n('requirement', r.requirement_id) },
      STAGE,
      { label: 'cd.faApproval', cell: (r, n) => n('approvalType', r.approval_type_id) },
    ],
  },
  schedule: {
    path: 'academic/student/final-assignment/transaction/schedules',
    titleKey: 'cd.faSchedules',
    lookups: { submission_id: 'submission', stage_id: 'stage', room_id: 'room' },
    columns: [
      SUBMISSION,
      STAGE,
      { label: 'cd.faDate', cell: (r) => `${day(r.schedule_date)} ${time(r.schedule_time)}`.trim() },
      { label: 'cd.faRoom', cell: (r, n) => n('room', r.room_id) },
    ],
  },
};

/** The list pages in menu order (the nav shows all but the adviser ones together). */
export const FA_NAV: FaKind[] = ['submission', 'adviser', 'evaluationSummary', 'decree', 'prerequisite', 'schedule'];

export const FA_ROUTE: Record<FaKind, string> = {
  counsellor: '/course-department/academic/student/adviser',
  adviserDecree: '/course-department/academic/student/adviser/decree',
  submission: '/course-department/academic/student/final-assignment/transaction/submission',
  adviser: '/course-department/academic/student/final-assignment/transaction/adviser',
  evaluationSummary: '/course-department/academic/student/final-assignment/transaction/evaluation-summary',
  decree: '/course-department/academic/student/final-assignment/transaction/final-assignment-decree',
  prerequisite: '/course-department/academic/student/final-assignment/transaction/prerequisite',
  schedule: '/course-department/academic/student/final-assignment/transaction/schedule',
};

/** What to call a looked-up record: students and lecturers by "code · name", everything else by name/title. */
export function nameOfRecord(kind: LookupKind, r: Rec): string {
  if (kind === 'student' || kind === 'lecturer') return [r.code, r.name ?? r.individual?.name].filter(Boolean).join(' · ');
  if (kind === 'submission') return String(r.title ?? '');
  if (kind === 'adviserDecree') return String(r.decree_number ?? '');
  return String(r.name ?? r.code ?? '');
}

/** The distinct ids to look up for a page of rows, grouped by kind (capped, junk dropped). */
export function idsToLookup(def: FaDef, rows: Rec[], cap = 60): Partial<Record<LookupKind, string[]>> {
  const out: Partial<Record<LookupKind, Set<string>>> = {};
  let n = 0;
  for (const r of rows) {
    for (const [field, kind] of Object.entries(def.lookups)) {
      const v = r[field];
      if (!kind || typeof v !== 'string' || !/^[0-9a-f-]{36}$/i.test(v) || v === '00000000-0000-0000-0000-000000000000') continue;
      const set = (out[kind] ??= new Set());
      if (!set.has(v) && n < cap) {
        set.add(v);
        n += 1;
      }
    }
  }
  return Object.fromEntries(Object.entries(out).map(([k, s]) => [k, [...s!]]));
}

export const makeNames =
  (map: Partial<Record<LookupKind, Record<string, string>>>): Names =>
  (kind, id) =>
    (typeof id === 'string' && map[kind]?.[id]) || '-';
