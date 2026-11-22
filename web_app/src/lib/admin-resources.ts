// Registry of the administrator's master/reference CRUD pages. One entry drives the list, the
// create/edit form and the server calls, so porting an area of the old client is data, not pages.
// Pure (no server imports): shared by the routes, the menu and the server.
import { ACADEMIC_MASTERS } from './admin-academic';
import { LOCATION_RESOURCES } from './admin-location';
import { MISC_RESOURCES } from './admin-misc';
import { check, date, reference, select, text, type AdminField, type AdminResource, type RefOpts } from './admin-fields';
import { parseForm, type ParseResult, type Raw } from './crud-schema';

/** Where a select field gets its options when it is not another registered resource. */
export const OPTION_SOURCES: Record<string, string> = {
  variety: 'institution/reference/varieties',
  category: 'institution/reference/categories',
  unit_type: 'institution/reference/unit-types',
  position_type: 'institution/reference/position-type',
  institution: 'institution/master/institutions',
  unit: 'institution/master/units',
  country: 'countries',
  academic_year: 'academic/general/reference/academic-years',
  education: 'educations',
  registration_category: 'academic/candidate/reference/registration-categories',
  student_registration: 'academic/student/reference/registrations',
  curriculum_type: 'academic/course/reference/curriculum-types',
  academic_year_category: 'academic/general/reference/academic-year-categories',
  stage: 'academic/student/final-assignment/reference/stages',
  individual: 'person/master/individual',
  user: 'user',
};

export type { AdminColumn, AdminField, AdminResource, OptionSource } from './admin-fields';
const EFFECTIVE: AdminField[] = [date('start_effective_date', 'ad.effectiveFrom'), date('end_effective_date', 'ad.effectiveUntil')];

const INST = ['ad.institution'];
const ACAD = (sub: string) => ['ad.academic', sub];

/** An academic reference table: `academic/<sub>/reference/<singular>` over the API's plural endpoint. */
const acRef = (sub: string, singular: string, plural: string, titleKey: string, subKey: string, o: RefOpts = {}) =>
  reference(`academic-${sub}-${singular}`.replace(/\//g, '-'), `academic/${sub}/reference/${singular}`, `academic/${sub}/reference/${plural}`, titleKey, { group: ACAD(subKey), ...o });

const description = text('description', 'ad.description', { max: 500 });
const OPT = { alphabet: 'optional' } as const;
const OPT_ALL = { alphabet: 'optional', codeOptional: true } as const;

const ACADEMIC_REFERENCES: AdminResource[] = [
  acRef('campaign', 'attend-type', 'attend-types', 'ad.attendType', 'ad.campaign'),
  acRef('campaign', 'calendar-category', 'calendar-categories', 'ad.calendarCategory', 'ad.campaign'),
  acRef('campaign', 'encounter-category', 'encounter-categories', 'ad.encounterCategory', 'ad.campaign'),
  acRef('campaign', 'implementation', 'implementations', 'ad.implementation', 'ad.campaign'),
  acRef('campaign', 'scope', 'scopes', 'ad.scope', 'ad.campaign'),
  acRef('campaign', 'substance', 'substances', 'ad.substance', 'ad.campaign'),
  acRef('candidate', 'document-type', 'document-types', 'ad.documentType', 'ad.candidate'),
  acRef('candidate', 'phase', 'phases', 'ad.phase', 'ad.candidate'),
  acRef('candidate', 'registration-category', 'registration-categories', 'ad.registrationCategory', 'ad.candidate', OPT_ALL),
  acRef('candidate', 'registration-type', 'registration-types', 'ad.registrationType', 'ad.candidate', {
    ...OPT_ALL,
    extra: [
      select('student_registration_id', 'ad.registration', 'student_registration'),
      select('unit_id', 'ad.unit', 'unit'),
      select('registration_category_id', 'ad.registrationCategory', 'registration_category'),
      select('institution_id', 'ad.institution', 'institution'),
    ],
  }),
  acRef('course', 'competence', 'competences', 'ad.competence', 'ad.course', { extra: EFFECTIVE }),
  acRef('course', 'course-evaluation-base', 'course-evaluation-bases', 'ad.courseEvaluationBase', 'ad.course', {
    alphabet: 'none',
    name: [text('evaluation_base', 'ad.evaluationBase', { required: true, max: 200 }), text('component_evaluation', 'ad.componentEvaluation', { required: true, max: 200 })],
    extra: EFFECTIVE,
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.evaluationBase', field: 'evaluation_base' }, { label: 'ad.componentEvaluation', field: 'component_evaluation' }],
  }),
  acRef('course', 'curriculum-type', 'curriculum-types', 'ad.curriculumType', 'ad.course', { ...OPT_ALL, extra: EFFECTIVE }),
  acRef('course', 'encounter-type', 'encounter-types', 'ad.encounterType', 'ad.course'),
  acRef('course', 'evaluation-type', 'evaluation-types', 'ad.evaluationType', 'ad.course', {
    extra: [text('english_name', 'ad.englishName', { max: 200 }), { name: 'feeder_id', label: 'ad.feederID', kind: 'uuid', input: 'text' }],
  }),
  acRef('course', 'group', 'groups', 'ad.group', 'ad.course', { ...OPT_ALL, extra: [text('abbreviation', 'ad.abbreviation', { max: 50 }), ...EFFECTIVE] }),
  acRef('course', 'semester', 'semesters', 'ad.semester', 'ad.course', { ...OPT_ALL, extra: [check('is_odd', 'ad.isOdd'), ...EFFECTIVE] }),
  acRef('course', 'variety', 'varieties', 'ad.variety', 'ad.course', { ...OPT_ALL, extra: [select('curriculum_type_id', 'ad.curriculumType', 'curriculum_type'), ...EFFECTIVE] }),
  acRef('general', 'academic-year-category', 'academic-year-categories', 'ad.academicYearCategory', 'ad.general'),
  {
    key: 'academic-general-academic-year',
    path: 'academic/general/reference/academic-year',
    api: 'academic/general/reference/academic-years',
    titleKey: 'ad.academicYear',
    group: ACAD('ad.general'),
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.year', field: 'year' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      { name: 'code', label: 'ad.code2', kind: 'int', input: 'text', required: true, min: 0, max: 99999 },
      { name: 'year', label: 'ad.year', kind: 'int', input: 'text', required: true, min: 1900, max: 2200 },
      text('name', 'ad.name', { required: true, max: 200 }),
      text('feeder_name', 'ad.feederName', { required: true, max: 200 }),
      select('academic_year_category_id', 'ad.academicYearCategory', 'academic_year_category', { required: true }),
      check('is_active', 'ad.active'),
      date('start_date', 'ad.startDate'),
      date('end_date', 'ad.endDate'),
    ],
  },
  acRef('lecturer', 'contract', 'contracts', 'ad.contract', 'ad.lecturer', OPT),
  acRef('lecturer', 'group', 'groups', 'ad.group', 'ad.lecturer', OPT),
  acRef('lecturer', 'rank', 'ranks', 'ad.rank', 'ad.lecturer', OPT),
  acRef('lecturer', 'status', 'statuses', 'ad.status', 'ad.lecturer', OPT),
  acRef('prior-learning-recognition', 'evaluator-type', 'evaluator-types', 'ad.evaluatorType', 'ad.priorLearningRecognition', { extra: [description] }),
  acRef('prior-learning-recognition', 'evidence-category', 'evidence-categories', 'ad.evidenceCategory', 'ad.priorLearningRecognition', { extra: [description] }),
  acRef('prior-learning-recognition', 'evidence-type', 'evidence-types', 'ad.evidenceType', 'ad.priorLearningRecognition'),
  acRef('prior-learning-recognition', 'professionalism', 'professionalisms', 'ad.professionalism', 'ad.priorLearningRecognition'),
  acRef('student/final-assignment', 'adviser-category', 'adviser-categories', 'ad.adviserCategory', 'ad.finalAssignment'),
  acRef('student/final-assignment', 'approval-type', 'approval-types', 'ad.approvalType', 'ad.finalAssignment'),
  acRef('student/final-assignment', 'category', 'categories', 'ad.category', 'ad.finalAssignment'),
  acRef('student/final-assignment', 'requirement', 'requirements', 'ad.requirement', 'ad.finalAssignment', { extra: [select('stage_id', 'ad.stage', 'stage')] }),
  acRef('student/final-assignment', 'stage', 'stages', 'ad.stage', 'ad.finalAssignment'),
  acRef('student/final-assignment', 'variety', 'varieties', 'ad.variety', 'ad.finalAssignment'),
  acRef('student', 'finance', 'finances', 'ad.finance', 'ad.student', OPT),
  acRef('student', 'registration', 'registrations', 'ad.registration', 'ad.student', OPT),
  acRef('student', 'resign-status', 'resign-statuses', 'ad.resignStatus', 'ad.student', OPT),
  acRef('student', 'selection-type', 'selection-types', 'ad.selectionType', 'ad.student', OPT),
  acRef('student', 'status', 'statuses', 'ad.status', 'ad.student', OPT),
  acRef('survey', 'bundle-category', 'bundle-categories', 'ad.bundleCategory', 'ad.survey'),
  acRef('survey', 'question-variety', 'question-varieties', 'ad.questionVariety', 'ad.survey'),
];

export const ADMIN_RESOURCES: AdminResource[] = [
  {
    key: 'institution',
    group: INST,
    path: 'institution/master/institution',
    api: 'institution/master/institutions',
    titleKey: 'ad.institutions',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.alphabetCode', field: 'alphabet_code' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      text('name', 'ad.name', { required: true, max: 200 }),
      text('code', 'ad.code2', { required: true, max: 50 }),
      text('alphabet_code', 'ad.alphabetCodeAcronym', { max: 50 }),
      check('is_active', 'ad.operationalStatus'),
      select('variety_id', 'ad.variety', 'variety', { required: true }),
      select('category_id', 'ad.category', 'category', { required: true }),
      select('country_id', 'ad.country', 'location-country', { required: true, input: 'lookup' }),
      select('parent_id', 'ad.parentInstitutionOptional', 'institution'),
      select('academic_year_id', 'ad.academicYear', 'academic_year'),
      { name: 'feeder_id', label: 'ad.feederID', kind: 'uuid', input: 'text' },
    ],
  },
  {
    key: 'unit',
    group: INST,
    path: 'institution/master/unit',
    api: 'institution/master/units',
    titleKey: 'ad.units',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      text('name', 'ad.name', { required: true, max: 200 }),
      text('code', 'ad.code2', { required: true, max: 50 }),
      check('is_active', 'ad.operationalStatus'),
      select('institution_id', 'ad.institution', 'institution', { required: true }),
      select('unit_type_id', 'ad.unitType', 'unit_type', { required: true }),
      select('education_id', 'ad.education', 'education', { required: true }),
      select('parent_id', 'ad.unit', 'unit'),
      { name: 'feeder_id', label: 'ad.feederID', kind: 'uuid', input: 'text' },
    ],
  },
  {
    key: 'employee',
    group: INST,
    path: 'institution/master/employee',
    api: 'institution/master/employees',
    titleKey: 'ad.employees',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      text('name', 'ad.name', { required: true, max: 200 }),
      text('code', 'ad.code2', { required: true, max: 50 }),
      select('institution_id', 'ad.institution', 'institution', { required: true }),
      { name: 'individual_id', label: 'rt.person', kind: 'uuid', input: 'lookup', options: 'individual', required: true },
      text('decree_number', 'cd.fDecreeNumber', { max: 100 }),
      date('decree_date', 'cd.fDecreeDate'),
      check('is_active', 'ad.active'),
    ],
  },
  {
    key: 'staff',
    group: INST,
    path: 'institution/master/staff',
    api: 'institution/master/staffes',
    titleKey: 'ad.staff',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.startDate', field: 'start_date' }, { label: 'ad.endDate', field: 'end_date' }],
    fields: [
      { name: 'employee_id', label: 'ad.employee', kind: 'uuid', input: 'lookup', options: 'employee', required: true },
      select('unit_id', 'ad.unit', 'unit', { required: true }),
      select('position_type_id', 'ad.positionType', 'position_type'),
      text('name', 'ad.name', { max: 200 }),
      text('code', 'ad.code2', { max: 50 }),
      text('decree_number', 'cd.fDecreeNumber', { max: 100 }),
      date('decree_date', 'cd.fDecreeDate'),
      date('start_date', 'cd.fStartDate'),
      date('end_date', 'cd.fEndDate'),
    ],
  },
  reference('category', 'institution/reference/category', 'institution/reference/categories', 'ad.category', { group: INST }),
  reference('variety', 'institution/reference/variety', 'institution/reference/varieties', 'ad.variety', { group: INST }),
  reference('unit-type', 'institution/reference/unit-type', 'institution/reference/unit-types', 'ad.unitType', { group: INST }),
  reference('position-type', 'institution/reference/position-type', 'institution/reference/position-type', 'ad.positionType', { group: INST }),
  ...ACADEMIC_REFERENCES,
  ...ACADEMIC_MASTERS,
  ...LOCATION_RESOURCES,
  ...MISC_RESOURCES,
];

/** The list endpoint behind a select's options: a static source or another registered resource. */
export function optionApi(source: string): string | undefined {
  return OPTION_SOURCES[source] ?? ADMIN_RESOURCES.find((r) => r.key === source)?.api;
}

export type AdminView =
  | { resource: AdminResource; view: 'list' }
  | { resource: AdminResource; view: 'create' }
  | { resource: AdminResource; view: 'edit'; id: string }
  | { resource: AdminResource; view: 'show'; id: string };

export function findAdminResourceByKey(key: string): AdminResource | undefined {
  return ADMIN_RESOURCES.find((r) => r.key === key);
}

/** Map the URL under /administrator (`institution/master/unit`, `.../create`, `.../<id>/edit`) to a resource and view. */
export function matchAdminPath(path: string): AdminView | null {
  const parts = path.split('/').filter(Boolean);
  for (const resource of ADMIN_RESOURCES) {
    const base = resource.path.split('/');
    if (parts.length < base.length || !base.every((s, i) => parts[i] === s)) continue;
    const rest = parts.slice(base.length);
    if (rest.length === 0) return { resource, view: 'list' };
    if (rest.length === 1 && rest[0] !== 'create') return { resource, view: 'show', id: rest[0] };
    if (resource.readOnly) return null;
    if (rest.length === 1) return resource.noCreate ? null : { resource, view: 'create' };
    if (rest.length === 2 && rest[1] === 'edit') return { resource, view: 'edit', id: rest[0] };
  }
  return null;
}

export const adminUrl = (r: AdminResource, ...rest: string[]) => `/administrator/${[r.path, ...rest].join('/')}`;

export const parseAdminForm = (r: AdminResource, input: Raw): ParseResult => parseForm(r.fields, input);
