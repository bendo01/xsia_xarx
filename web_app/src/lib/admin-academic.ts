// Academic master and transaction resources of the administrator registry. The old client let
// the administrator create/edit only a few of them (course, curriculum, concentration, exam
// class, survey questions...); the rest were list-only and stay read-only here.
import { day, fk, flag, int, labelKey, num, pick, str, stamp, clock, uid, type AdminField, type AdminResource } from './admin-fields';

const AREA_LABEL: Record<string, string> = {
  campaign: 'ad.campaign',
  candidate: 'ad.candidate',
  course: 'ad.course',
  lecturer: 'ad.lecturer',
  student: 'ad.student',
  survey: 'ad.survey',
  'prior-learning-recognition': 'ad.priorLearningRecognition',
  'student/final-assignment': 'ad.finalAssignment',
};

interface Spec {
  /** `<area>/<kind>/<singular>` under `academic/`, as in the old client's urls. */
  path: string;
  /** Plural endpoint segment. */
  plural: string;
  /** Column field names of the list. */
  columns: string[];
  /** Present = editable resource; absent = read-only list. */
  fields?: AdminField[];
  title?: string;
}

const make = (s: Spec): AdminResource => {
  const parts = s.path.split('/');
  const singular = parts[parts.length - 1];
  const areaKey = parts[0] === 'student' && parts[1] === 'final-assignment' ? 'student/final-assignment' : parts[0];
  return {
    key: `academic-${s.path.replace(/\//g, '-')}`,
    path: `academic/${s.path}`,
    api: `academic/${parts.slice(0, -1).join('/')}/${s.plural}`,
    titleKey: s.title ?? labelKey(singular.replace(/-/g, '_')),
    group: ['ad.academic', AREA_LABEL[areaKey] ?? 'ad.academic'],
    columns: s.columns.map((field) => ({ label: labelKey(field), field })),
    fields: s.fields ?? [],
    readOnly: !s.fields,
  };
};

export const ACADEMIC_MASTERS: AdminResource[] = ([
  // course
  { path: 'course/master/concentration', plural: 'concentrations', columns: ['code', 'name', 'unit_id'], fields: [int('code', true), str('name', true), fk('unit_id', 'unit', true)] },
  {
    path: 'course/master/course',
    plural: 'courses',
    columns: ['code', 'name', 'total_credit', 'unit_id'],
    fields: [
      str('code', true, 50), str('name', true), str('implementation_method', false, 100),
      num('total_credit', true, 0, 50), num('lecture_credit', true, 0, 50), num('practice_credit', true, 0, 50),
      num('field_practice_credit', true, 0, 50), num('simulation_credit', true, 0, 50),
      flag('has_unit'), flag('has_syllabus'), flag('has_material'), flag('has_practice'), flag('has_dictation'),
      fk('group_id', 'academic-course-group'), fk('variety_id', 'academic-course-variety', true), fk('unit_id', 'unit', true),
      fk('competence_id', 'academic-course-competence'),
      uid('feeder_course_group_id'), uid('feeder_course_type_id'), uid('feeder_course_id'),
      day('start_date'), day('end_date'),
    ],
  },
  {
    path: 'course/master/curriculum',
    plural: 'curriculums',
    columns: ['name', 'total_credit', 'start_date', 'is_active'],
    fields: [
      str('name', true), fk('unit_id', 'unit', true), fk('academic_year_id', 'academic_year', true),
      fk('curriculum_type_id', 'academic-course-curriculum-type', true),
      num('total_credit', false, 0, 500), num('mandatory_course_credit', false, 0, 500), num('optional_course_credit', false, 0, 500),
      uid('feeder_id'), day('start_date'), day('end_date'), flag('is_active'),
    ],
  },
  // candidate
  {
    path: 'candidate/master/exam-class',
    plural: 'exam-classes',
    columns: ['code', 'name', 'start_date', 'capacity'],
    fields: [
      int('code'), str('alphabet_code', false, 20), str('name', true), fk('phase_id', 'academic-candidate-phase'),
      stamp('start_date', true), stamp('end_date'), clock('start_time'), clock('end_time'),
      int('capacity', true, 0, 100000), int('lms_category'), flag('is_online'),
    ],
  },
  {
    path: 'candidate/master/candidate',
    plural: 'candidates',
    columns: ['code', 'name', 'school_name', 'guidence_name'],
    fields: [
      int('thread'), str('code', false, 50), str('name', true), str('student_national_number', false, 50), str('school_name'),
      pick('school_regency_id', 'location-regency'), str('state_smart_card_number', false, 50),
      pick('individual_id', 'individual'), fk('academic_year_id', 'academic_year'), pick('student_id', 'academic-student-master-student'),
      pick('user_id', 'user', true), fk('registration_type_id', 'academic-candidate-registration-type', true), fk('institution_id', 'institution', true),
      str('guidence_name'), str('guidence_phone_number', false, 50),
    ],
  },
  { path: 'candidate/transaction/candidate-unit-choice', plural: 'candidate-unit-choices', columns: ['candidate_id', 'unit_id', 'priority'] },
  {
    path: 'candidate/transaction/document',
    plural: 'documents',
    columns: ['filename', 'size', 'is_verified'],
    // The API stores the file's metadata only; the binary is uploaded by the candidate's own flow.
    fields: [pick('candidate_id', 'academic-candidate-master-candidate', true), fk('document_type_id', 'academic-candidate-document-type', true), str('filename', false, 255), str('dir', false, 255), int('size', false, 0, 2_000_000_000), flag('is_verified')],
  },
  { path: 'candidate/transaction/exam', plural: 'exams', columns: ['candidate_id', 'score', 'is_present', 'is_pass'] },
  // campaign
  { path: 'campaign/transaction/activity', plural: 'activities', columns: ['name', 'student_target', 'start_date', 'end_date', 'is_active'] },
  { path: 'campaign/transaction/class-code', plural: 'class-codes', columns: ['code', 'name', 'capacity', 'start_effective_date', 'end_effective_date'] },
  { path: 'campaign/transaction/grade', plural: 'grades', columns: ['code', 'name', 'grade', 'minimum', 'maximum'] },
  { path: 'campaign/transaction/schedule', plural: 'schedules', columns: ['name', 'start_hour', 'end_hour'] },
  { path: 'campaign/transaction/teach', plural: 'teaches', columns: ['name', 'start_date', 'end_date', 'max_member', 'is_lock'] },
  { path: 'campaign/transaction/teach-decree', plural: 'teach-decrees', columns: ['decree_number', 'decree_date'] },
  { path: 'campaign/transaction/teach-evaluation', plural: 'teach-evaluations', columns: ['name', 'english_name', 'evaluation_weight'] },
  { path: 'campaign/transaction/teach-lecturer', plural: 'teach-lecturers', columns: ['name', 'planning', 'realization', 'credit', 'is_lecturer_home_base'] },
  {
    path: 'campaign/transaction/calendar',
    plural: 'calendars',
    columns: ['name', 'academic_year_id', 'institution_id'],
    fields: [str('name', true), fk('academic_year_id', 'academic_year', true), fk('institution_id', 'institution', true)],
  },
  {
    path: 'campaign/transaction/calendar-detail',
    plural: 'calendar-details',
    columns: ['name', 'start_date', 'end_date'],
    fields: [str('name', true), pick('calendar_id', 'academic-campaign-transaction-calendar', true), fk('calendar_category_id', 'academic-campaign-calendar-category', true), day('start_date', true), day('end_date', true)],
  },
  // lecturer
  { path: 'lecturer/master/lecturer', plural: 'lecturers', columns: ['code', 'name', 'front_title', 'last_title', 'nuptk'] },
  { path: 'lecturer/transaction/academic-group', plural: 'academic-groups', columns: ['decree_number', 'decree_date', 'start_date', 'end_date'] },
  { path: 'lecturer/transaction/academic-rank', plural: 'academic-ranks', columns: ['decree_number', 'decree_date', 'start_date', 'end_date'] },
  { path: 'lecturer/transaction/homebase', plural: 'homebases', columns: ['lecturer_id', 'unit_id', 'institution_id'] },
  // prior learning recognition
  { path: 'prior-learning-recognition/transaction/decree', plural: 'decrees', columns: ['decree_number', 'decree_date'] },
  { path: 'prior-learning-recognition/transaction/evaluation', plural: 'evaluations', columns: ['recognition_id', 'professionalism_id', 'evidence_type_id'] },
  { path: 'prior-learning-recognition/transaction/evaluator', plural: 'evaluators', columns: ['individual_id', 'evaluator_type_id', 'recognition_id'] },
  { path: 'prior-learning-recognition/transaction/recognition', plural: 'recognitions', columns: ['name', 'candidate_id', 'curriculum_id', 'unit_id'] },
  // student
  {
    path: 'student/master/student',
    plural: 'students',
    columns: ['code', 'name', 'registered', 'nisn', 'finance_fee'],
    // concentration, class code, resign status and transfer unit are NOT NULL in the model but unset for
    // most students (the API stores a placeholder), so the form leaves them optional.
    fields: [
      str('code', true, 50), str('name', true), fk('selection_type_id', 'academic-student-selection-type', true), day('registered', true),
      pick('individual_id', 'individual', true), fk('status_id', 'academic-student-status', true), fk('unit_id', 'unit', true),
      fk('academic_year_id', 'academic_year', true), fk('registration_id', 'academic-student-registration', true),
      str('nisn', false, 50), fk('resign_status_id', 'academic-student-resign-status'),
      pick('concentration_id', 'academic-course-master-concentration'), pick('curriculum_id', 'academic-course-master-curriculum', true),
      pick('class_code_id', 'academic-campaign-transaction-class-code'),
      str('transfer_code', false, 50), fk('transfer_unit_id', 'unit'), fk('finance_id', 'academic-student-finance'), num('finance_fee', false, 0, 1_000_000_000_000),
      uid('id_mahasiswa'), uid('id_registrasi_mahasiswa'),
    ],
  },
  {
    path: 'student/master/image',
    plural: 'images',
    columns: ['filename', 'dir', 'mimetype', 'size'],
    // Metadata only: the API has no upload endpoint for student photos.
    fields: [pick('student_id', 'academic-student-master-student', true), str('filename', true, 255), str('dir', true, 255), str('mimetype', false, 100), int('size', false, 0, 2_000_000_000)],
  },
  { path: 'student/adviser/counsellor', plural: 'counsellors', columns: ['student_id', 'lecturer_id', 'decree_id'] },
  { path: 'student/adviser/decree', plural: 'decrees', columns: ['decree_number', 'decree_date', 'unit_id'] },
  { path: 'student/campaign/convertion', plural: 'convertions', columns: ['name', 'transfer_code', 'transfer_name', 'transfer_credit', 'transfer_grade'] },
  { path: 'student/campaign/detail-activity', plural: 'detail-activities', columns: ['name', 'mark', 'credit', 'course_id'] },
  { path: 'student/campaign/detail-activity-evaluation-component', plural: 'detail-activity-evaluation-components', columns: ['name', 'mark', 'percentage', 'total'] },
  { path: 'student/campaign/student-activity', plural: 'student-activities', columns: ['name', 'cumulative_index', 'total_credit', 'is_lock'] },
  { path: 'student/final-assignment/transaction/adviser', plural: 'advisers', columns: ['thread', 'lecturer_id', 'adviser_category_id'] },
  { path: 'student/final-assignment/transaction/evaluation-detail', plural: 'evaluation-details', columns: ['evaluation_summary_id', 'adviser_id', 'mark'] },
  { path: 'student/final-assignment/transaction/evaluation-summary', plural: 'evaluation-summaries', columns: ['detail_activity_id', 'stage_id', 'mark'] },
  { path: 'student/final-assignment/transaction/final-assignment-decree', plural: 'final-assignment-decrees', columns: ['decree_number', 'decree_date'] },
  { path: 'student/final-assignment/transaction/prerequisite', plural: 'prerequisites', columns: ['thread', 'filename', 'filesize'] },
  { path: 'student/final-assignment/transaction/schedule', plural: 'schedules', columns: ['schedule_date', 'schedule_time', 'zoom_meeting'] },
  { path: 'student/final-assignment/transaction/submission', plural: 'submissions', columns: ['title', 'student_id', 'filename'] },
  // survey
  { path: 'survey/master/answer', plural: 'answers', columns: ['code', 'name', 'point'], fields: [int('code', true), str('alphabet_code', false, 20), str('name', true), pick('question_id', 'academic-survey-master-question', true), num('point', true, -1000, 1000), str('suggestion', false, 500)] },
  {
    path: 'survey/master/bundle',
    plural: 'bundles',
    columns: ['code', 'alphabet_code', 'name'],
    fields: [int('code', true), str('alphabet_code', true, 20), str('name', true), fk('institution_id', 'institution', true), fk('bundle_category_id', 'academic-survey-bundle-category', true), fk('unit_id', 'unit'), str('suggestion', false, 500)],
  },
  { path: 'survey/master/bundle-question', plural: 'bundle-question', columns: ['bundle_id', 'question_id'], fields: [pick('bundle_id', 'academic-survey-master-bundle', true), pick('question_id', 'academic-survey-master-question', true)] },
  {
    path: 'survey/master/question',
    plural: 'questions',
    columns: ['code', 'alphabet_code', 'name'],
    fields: [int('code', true), str('alphabet_code', false, 20), str('name', true), fk('institution_id', 'institution', true), fk('question_variety_id', 'academic-survey-question-variety'), str('suggestion', false, 500)],
  },
  { path: 'survey/transaction/conduct', plural: 'conducts', columns: ['name', 'conductable_type', 'is_finish'] },
  { path: 'survey/transaction/respond', plural: 'responds', columns: ['name', 'conduct_id', 'question_id'] },
] satisfies Spec[]).map(make);
