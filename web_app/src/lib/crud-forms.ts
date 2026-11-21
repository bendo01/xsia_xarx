// Which inputs each CRUD form shows, in order. Labels are i18n keys (`cd.*`).
import type { ChildKey, ResourceKey, TopKey } from './crud-schema';

export type Widget = 'text' | 'textarea' | 'number' | 'int' | 'date' | 'select' | 'check';
export interface FormFieldDef {
  name: string;
  label: string;
  widget: Widget;
  required?: boolean;
  /** number inputs */
  step?: string;
}

const text = (name: string, label: string, required = false): FormFieldDef => ({ name, label, widget: 'text', required });
const num = (name: string, label: string, required = false): FormFieldDef => ({ name, label, widget: 'number', step: '0.5', required });
const area = (name: string, label: string, required = false): FormFieldDef => ({ name, label, widget: 'textarea', required });
const int = (name: string, label: string): FormFieldDef => ({ name, label, widget: 'int' });
const date = (name: string, label: string, required = false): FormFieldDef => ({ name, label, widget: 'date', required });
const select = (name: string, label: string, required = false): FormFieldDef => ({ name, label, widget: 'select', required });
const check = (name: string, label: string): FormFieldDef => ({ name, label, widget: 'check' });

export const FORMS: Record<ResourceKey, FormFieldDef[]> = {
  course: [
    text('code', 'cd.fCode', true),
    text('name', 'cd.fName', true),
    select('variety_id', 'cd.fVariety', true),
    select('group_id', 'cd.fGroup'),
    select('competence_id', 'cd.fCompetence'),
    text('implementation_method', 'cd.fMethod'),
    num('lecture_credit', 'cd.fLecture', true),
    num('practice_credit', 'cd.fPractice', true),
    num('field_practice_credit', 'cd.fFieldPractice', true),
    num('simulation_credit', 'cd.fSimulation', true),
    num('total_credit', 'cd.fTotal', true),
    date('start_date', 'cd.fStartDate'),
    date('end_date', 'cd.fEndDate'),
    check('has_unit', 'cd.fHasUnit'),
    check('has_syllabus', 'cd.fHasSyllabus'),
    check('has_material', 'cd.fHasMaterial'),
    check('has_practice', 'cd.fHasPractice'),
    check('has_dictation', 'cd.fHasDictation'),
  ],
  curriculum: [
    text('name', 'cd.fName', true),
    select('academic_year_id', 'cd.fAcademicYear', true),
    select('curriculum_type_id', 'cd.fCurriculumType', true),
    num('total_credit', 'cd.fTotal'),
    num('mandatory_course_credit', 'cd.fMandatory'),
    num('optional_course_credit', 'cd.fOptional'),
    date('start_date', 'cd.fStartDate'),
    date('end_date', 'cd.fEndDate'),
    check('is_active', 'cd.fActive'),
  ],
  classCode: [
    text('name', 'cd.fName', true),
    select('activity_id', 'cd.fActivity', true),
    int('code', 'cd.fClassNumber'),
    text('alphabet_code', 'cd.fClassLetter'),
    int('capacity', 'cd.fCapacity'),
    date('start_effective_date', 'cd.fStartEffective'),
    date('end_effective_date', 'cd.fEndEffective'),
  ],
  activity: [
    text('name', 'cd.fName', true),
    select('academic_year_id', 'cd.fAcademicYear', true),
    int('week_quantity', 'cd.fWeeks'),
    int('student_target', 'cd.fStudentTarget'),
    int('candidate_number', 'cd.fCandidates'),
    int('candidate_pass', 'cd.fCandidatesPass'),
    int('became_student', 'cd.fBecameStudent'),
    int('transfer_student', 'cd.fTransfer'),
    int('total_class_member', 'cd.fClassMembers'),
    date('start_date', 'cd.fStartDate'),
    date('end_date', 'cd.fEndDate'),
    date('start_transaction', 'cd.fStartTransaction'),
    date('end_transaction', 'cd.fEndTransaction'),
    check('is_active', 'cd.fActive'),
  ],
  grade: [
    text('name', 'cd.fName', true),
    text('alphabet_code', 'cd.fGradeLetter'),
    num('grade', 'cd.fGradePoint', true),
    num('minimum', 'cd.fMinimum', true),
    num('maximum', 'cd.fMaximum', true),
    int('code', 'cd.fCode'),
    date('start_date', 'cd.fStartDate'),
    date('end_date', 'cd.fEndDate'),
  ],
  staff: [
    select('employee_id', 'cd.fEmployee', true),
    text('name', 'cd.fName'),
    text('code', 'cd.fCode'),
    select('position_type_id', 'cd.fPosition'),
    text('decree_number', 'cd.fDecreeNumber'),
    date('decree_date', 'cd.fDecreeDate'),
    date('start_date', 'cd.fStartDate'),
    date('end_date', 'cd.fEndDate'),
  ],
  teach: [
    select('course_id', 'cd.fCourse', true),
    select('class_code_id', 'cd.teachClassCode', true),
    select('activity_id', 'cd.fActivity'),
    select('teach_decree_id', 'cd.fDecreeEntity', true),
    select('curriculum_detail_id', 'cd.fCurriculumEntry'),
    select('encounter_category_id', 'cd.fEncounter'),
    select('scope_id', 'cd.fScope'),
    text('name', 'cd.fName'),
    int('max_member', 'cd.fCapacity'),
    date('start_date', 'cd.fStartDate'),
    date('end_date', 'cd.fEndDate'),
    date('practice_start_date', 'cd.fPracticeStart'),
    date('practice_end_date', 'cd.fPracticeEnd'),
    area('description', 'cd.fDescription'),
    check('is_lecturer_credit_sum_problem', 'cd.fCreditProblem'),
  ],
  teachDecree: [
    text('decree_number', 'cd.fDecreeNumber', true),
    date('decree_date', 'cd.fDecreeDate', true),
    select('staff_id', 'cd.fStaffMember'),
  ],
  teachLecturer: [
    select('lecturer_id', 'cd.fLecturer', true),
    text('name', 'cd.fName'),
    int('planning', 'cd.fPlanned'),
    int('realization', 'cd.fRealized'),
    num('credit', 'cd.fCredit'),
    check('is_lecturer_home_base', 'cd.fHomeBase'),
  ],
  teachEvaluation: [
    text('name', 'cd.fName', true),
    text('english_name', 'cd.fEnglishName'),
    select('evaluation_type_id', 'cd.fEvalType'),
    num('evaluation_weight', 'cd.fPercentage'),
    int('thread', 'cd.fThread'),
  ],
  curriculumDetail: [
    select('course_id', 'cd.fCourse', true),
    select('semester_id', 'cd.fSemester', true),
    num('credit', 'cd.fCredit'),
    int('code', 'cd.fClassNumber'),
    text('name', 'cd.fName'),
    select('concentration_id', 'cd.fConcentration'),
  ],
  learnPlanning: [
    int('code', 'cd.fCode'),
    text('name', 'cd.fName', true),
    area('decription_indonesian', 'cd.fDescId', true),
    area('decription_english', 'cd.fDescEn'),
  ],
  evaluationPlanning: [
    text('name', 'cd.fName', true),
    select('evaluation_type_id', 'cd.fEvalType', true),
    num('percentage', 'cd.fPercentage'),
    int('code', 'cd.fCode'),
    area('decription_indonesian', 'cd.fDescId', true),
    area('decription_english', 'cd.fDescEn'),
  ],
};

/** Starting values for a new record (credits are numbers as text so inputs stay controlled). */
export const DEFAULTS: Record<ResourceKey, Record<string, string | boolean>> = {
  course: {
    implementation_method: 'Kuliah', lecture_credit: '2', practice_credit: '0', field_practice_credit: '0', simulation_credit: '0', total_credit: '2',
    has_unit: true, has_syllabus: true, has_material: true, has_practice: false, has_dictation: false,
  },
  curriculum: { is_active: true },
  classCode: { code: '1', capacity: '0' },
  activity: { student_target: '0', candidate_number: '0', candidate_pass: '0', became_student: '0', transfer_student: '0', is_active: true },
  grade: {},
  staff: {},
  teach: {},
  teachDecree: {},
  teachLecturer: { planning: '16', realization: '0' },
  teachEvaluation: {},
  curriculumDetail: {},
  learnPlanning: { code: '1' },
  evaluationPlanning: { code: '1' },
};

/** The route a record's pages live under. */
export const BASE: Record<TopKey, string> = {
  course: '/course-department/academic/course/master/course',
  curriculum: '/course-department/academic/course/master/curriculum',
  classCode: '/course-department/academic/campaign/transaction/class-code',
  activity: '/course-department/academic/campaign/transaction/activity',
  grade: '/course-department/academic/campaign/transaction/grade',
  staff: '/course-department/institution/master/staff',
  teach: '/course-department/academic/campaign/transaction/teach',
};

/** Turns an API record into the strings/booleans the form edits (dates cut to YYYY-MM-DD). */
export function toFormValues(key: ResourceKey, rec: Record<string, any> | null): Record<string, string | boolean> {
  if (!rec) return { ...DEFAULTS[key] };
  const out: Record<string, string | boolean> = {};
  for (const f of FORMS[key]) {
    const v = rec[f.name];
    out[f.name] = f.widget === 'check' ? Boolean(v) : v === null || v === undefined ? '' : f.widget === 'date' ? String(v).slice(0, 10) : String(v);
  }
  return out;
}

const CHILD_SEGMENT: Record<ChildKey, { parent: TopKey; segment: string }> = {
  teachDecree: { parent: 'activity', segment: 'teach-decree' },
  teachLecturer: { parent: 'teach', segment: 'lecturer' },
  teachEvaluation: { parent: 'teach', segment: 'evaluation' },
  curriculumDetail: { parent: 'curriculum', segment: 'curriculum-detail' },
  learnPlanning: { parent: 'course', segment: 'course-learn-planning' },
  evaluationPlanning: { parent: 'course', segment: 'course-evaluation-planning' },
};

/** The list page of a child resource (`.../curriculum/<id>/curriculum-detail`). */
export const childBase = (key: ChildKey, parentId: string) =>
  `${BASE[CHILD_SEGMENT[key].parent]}/${encodeURIComponent(parentId)}/${CHILD_SEGMENT[key].segment}`;

export const parentOfChild = (key: ChildKey): TopKey => CHILD_SEGMENT[key].parent;

export const isChild = (key: ResourceKey): key is ChildKey => key in CHILD_SEGMENT;
