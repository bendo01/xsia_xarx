// What the list and detail pages show for each resource (plain strings, so it is testable).
import type { ChildKey, TopKey } from './crud-schema';

type Rec = Record<string, any>;
export interface ColumnDef {
  label: string;
  cell: (r: Rec) => string;
}

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));
const day = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 10) : '-');
const nameOf = (v: unknown) => (v && typeof v === 'object' ? ((v as Rec).name as string | undefined) : undefined);
const period = (a: unknown, b: unknown) => (!a && !b ? '-' : `${day(a)} – ${b ? day(b) : '…'}`);

const STAFF_COLS: ColumnDef[] = [
  { label: 'cd.fName', cell: (r) => dash(r.name) },
  { label: 'cd.fCode', cell: (r) => dash(r.code) },
  { label: 'cd.fDecree', cell: (r) => dash(r.decree_number) },
  { label: 'cd.fStartDate', cell: (r) => period(r.start_date, r.end_date) },
];
const TEACH_COLS: ColumnDef[] = [
  { label: 'cd.teachCourse', cell: (r) => dash(r.course?.name ?? r.name) },
  { label: 'cd.teachClassCode', cell: (r) => dash(r.class_code?.name) },
  { label: 'cd.fCapacity', cell: (r) => dash(r.max_member) },
];
const ACTIVITY_COLS: ColumnDef[] = [
  { label: 'cd.fName', cell: (r) => dash(r.name) },
  { label: 'cd.fAcademicYear', cell: (r) => dash(nameOf(r.academic_year) ?? r.academic_year_name) },
  { label: 'cd.fStartDate', cell: (r) => period(r.start_date, r.end_date) },
  { label: 'cd.fStudentTarget', cell: (r) => dash(r.student_target) },
  { label: 'cd.fActive', cell: (r) => (r.is_active ? '✓' : '-') },
];
const GRADE_COLS: ColumnDef[] = [
  { label: 'cd.fGradeLetter', cell: (r) => dash(r.alphabet_code) },
  { label: 'cd.fName', cell: (r) => dash(r.name) },
  { label: 'cd.fGradePoint', cell: (r) => dash(r.grade) },
  { label: 'cd.fMinimum', cell: (r) => dash(r.minimum) },
  { label: 'cd.fMaximum', cell: (r) => dash(r.maximum) },
];

export const COLUMNS: Record<TopKey, ColumnDef[]> = {
  staff: STAFF_COLS,
  teach: TEACH_COLS,
  activity: ACTIVITY_COLS,
  grade: GRADE_COLS,
  course: [
    { label: 'cd.fCode', cell: (r) => dash(r.code) },
    { label: 'cd.fName', cell: (r) => dash(r.name) },
    { label: 'cd.fTotal', cell: (r) => dash(r.total_credit) },
    { label: 'cd.fVariety', cell: (r) => dash(nameOf(r.variety) ?? r.variety_name) },
  ],
  curriculum: [
    { label: 'cd.fName', cell: (r) => dash(r.name) },
    { label: 'cd.fAcademicYear', cell: (r) => dash(nameOf(r.academic_year) ?? r.academic_year_name) },
    { label: 'cd.fCurriculumType', cell: (r) => dash(nameOf(r.curriculum_type) ?? r.curriculum_type_name) },
    { label: 'cd.fTotal', cell: (r) => dash(r.total_credit) },
  ],
  classCode: [
    { label: 'cd.fName', cell: (r) => dash(r.name) },
    { label: 'cd.fClassLetter', cell: (r) => dash(r.alphabet_code ?? r.code) },
    { label: 'cd.fCapacity', cell: (r) => dash(r.capacity) },
    { label: 'cd.fStartEffective', cell: (r) => period(r.start_effective_date, r.end_effective_date) },
  ],
};

export const DETAIL: Record<TopKey, ColumnDef[]> = {
  staff: [...STAFF_COLS, { label: 'cd.fDecreeDate', cell: (r) => day(r.decree_date) }],
  teach: [...TEACH_COLS, { label: 'cd.fStartDate', cell: (r) => period(r.start_date, r.end_date) }],
  activity: [
    ...ACTIVITY_COLS,
    { label: 'cd.fWeeks', cell: (r) => dash(r.week_quantity) },
    { label: 'cd.fCandidates', cell: (r) => dash(r.candidate_number) },
    { label: 'cd.fCandidatesPass', cell: (r) => dash(r.candidate_pass) },
    { label: 'cd.fBecameStudent', cell: (r) => dash(r.became_student) },
    { label: 'cd.fTransfer', cell: (r) => dash(r.transfer_student) },
    { label: 'cd.fStartTransaction', cell: (r) => period(r.start_transaction, r.end_transaction) },
  ],
  grade: [...GRADE_COLS, { label: 'cd.fCode', cell: (r) => dash(r.code) }, { label: 'cd.fStartDate', cell: (r) => period(r.start_date, r.end_date) }],
  course: [
    ...COLUMNS.course.slice(0, 2),
    { label: 'cd.fVariety', cell: (r) => dash(nameOf(r.variety) ?? r.variety_name) },
    { label: 'cd.fGroup', cell: (r) => dash(nameOf(r.group) ?? r.group_name) },
    { label: 'cd.fMethod', cell: (r) => dash(r.implementation_method) },
    { label: 'cd.fLecture', cell: (r) => dash(r.lecture_credit) },
    { label: 'cd.fPractice', cell: (r) => dash(r.practice_credit) },
    { label: 'cd.fFieldPractice', cell: (r) => dash(r.field_practice_credit) },
    { label: 'cd.fSimulation', cell: (r) => dash(r.simulation_credit) },
    { label: 'cd.fTotal', cell: (r) => dash(r.total_credit) },
    { label: 'cd.fStartDate', cell: (r) => period(r.start_date, r.end_date) },
  ],
  curriculum: [
    ...COLUMNS.curriculum,
    { label: 'cd.fMandatory', cell: (r) => dash(r.mandatory_course_credit) },
    { label: 'cd.fOptional', cell: (r) => dash(r.optional_course_credit) },
    { label: 'cd.fStartDate', cell: (r) => period(r.start_date, r.end_date) },
  ],
  classCode: [
    ...COLUMNS.classCode,
    { label: 'cd.fClassNumber', cell: (r) => dash(r.code) },
    { label: 'cd.fActivity', cell: (r) => dash(nameOf(r.activity) ?? r.activity_name) },
  ],
};

export const TITLES: Record<TopKey, { list: string; add: string; edit: string }> = {
  staff: { list: 'menu.courseDepartment.staffDirectory', add: 'cd.newStaff', edit: 'cd.editStaff' },
  teach: { list: 'menu.courseDepartment.teachDirectory', add: 'cd.newTeach', edit: 'cd.editTeach' },
  activity: { list: 'menu.courseDepartment.activityDirectory', add: 'cd.newActivity', edit: 'cd.editActivity' },
  grade: { list: 'menu.courseDepartment.gradeDirectory', add: 'cd.newGrade', edit: 'cd.editGrade' },
  course: { list: 'menu.courseDepartment.courseDirectory', add: 'cd.newCourse', edit: 'cd.editCourse' },
  curriculum: { list: 'menu.courseDepartment.curriculumDirectory', add: 'cd.newCurriculum', edit: 'cd.editCurriculum' },
  classCode: { list: 'menu.courseDepartment.classCodeDirectory', add: 'cd.newClassCode', edit: 'cd.editClassCode' },
};

const clip = (v: unknown, n = 90) => {
  const s = dash(v);
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

export const CHILD_COLUMNS: Record<ChildKey, ColumnDef[]> = {
  teachDecree: [
    { label: 'cd.fDecreeNumber', cell: (r) => dash(r.decree_number) },
    { label: 'cd.fDecreeDate', cell: (r) => day(r.decree_date) },
  ],
  teachLecturer: [
    { label: 'cd.fLecturer', cell: (r) => dash(r.name ?? r.code) },
    { label: 'cd.fPlanned', cell: (r) => dash(r.planning) },
    { label: 'cd.fRealized', cell: (r) => dash(r.realization) },
    { label: 'cd.fHomeBase', cell: (r) => (r.is_lecturer_home_base ? '★' : '-') },
  ],
  teachEvaluation: [
    { label: 'cd.fThread', cell: (r) => dash(r.thread) },
    { label: 'cd.fName', cell: (r) => dash(r.name) },
    { label: 'cd.fPercentage', cell: (r) => dash(r.evaluation_weight) },
  ],
  curriculumDetail: [
    { label: 'cd.fCode', cell: (r) => dash(r.course?.code ?? r.course_code) },
    { label: 'cd.fCourse', cell: (r) => dash(r.course?.name ?? r.course_name ?? r.name) },
    { label: 'cd.fSemester', cell: (r) => dash(nameOf(r.semester) ?? r.semester_name) },
    { label: 'cd.fCredit', cell: (r) => dash(r.credit ?? r.course?.total_credit) },
  ],
  learnPlanning: [
    { label: 'cd.fCode', cell: (r) => dash(r.code) },
    { label: 'cd.fName', cell: (r) => dash(r.name) },
    { label: 'cd.fDescId', cell: (r) => clip(r.decription_indonesian) },
  ],
  evaluationPlanning: [
    { label: 'cd.fName', cell: (r) => dash(r.name) },
    { label: 'cd.fEvalType', cell: (r) => dash(nameOf(r.evaluation_type) ?? r.evaluation_type_name) },
    { label: 'cd.fPercentage', cell: (r) => dash(r.percentage) },
    { label: 'cd.fDescId', cell: (r) => clip(r.decription_indonesian) },
  ],
};

export const CHILD_TITLES: Record<ChildKey, { list: string; add: string; edit: string }> = {
  teachDecree: { list: 'cd.teachDecrees', add: 'cd.addTeachDecree', edit: 'cd.editTeachDecree' },
  teachLecturer: { list: 'cd.teachLecturerList', add: 'cd.addTeachLecturer', edit: 'cd.editTeachLecturer' },
  teachEvaluation: { list: 'cd.teachEvaluationList', add: 'cd.addTeachEvaluation', edit: 'cd.editTeachEvaluation' },
  curriculumDetail: { list: 'cd.curriculumCourses', add: 'cd.addCourse', edit: 'cd.editCourseEntry' },
  learnPlanning: { list: 'cd.learnPlannings', add: 'cd.addLearnPlanning', edit: 'cd.editLearnPlanning' },
  evaluationPlanning: { list: 'cd.evalPlannings', add: 'cd.addEvalPlanning', edit: 'cd.editEvalPlanning' },
};
