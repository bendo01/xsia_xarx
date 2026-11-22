// How a record's detail page connects to other records, without per-resource pages: which foreign-key
// fields name which resource, and which resources list records that point back at this one.

/** Foreign-key field name -> a key of OPTION_SOURCES or of a registered resource. */
export const FK_SOURCES: Record<string, string> = {
  unit_id: 'unit',
  institution_id: 'institution',
  academic_year_id: 'academic_year',
  individual_id: 'individual',
  user_id: 'auth-user',
  role_id: 'auth-role',
  permission_id: 'auth-permission',
  position_type_id: 'position_type',
  employee_id: 'employee',
  staff_id: 'staff',
  student_id: 'academic-student-master-student',
  lecturer_id: 'academic-lecturer-master-lecturer',
  candidate_id: 'academic-candidate-master-candidate',
  course_id: 'academic-course-master-course',
  curriculum_id: 'academic-course-master-curriculum',
  concentration_id: 'academic-course-master-concentration',
  semester_id: 'academic-course-semester',
  activity_id: 'academic-campaign-transaction-activity',
  unit_activity_id: 'academic-campaign-transaction-activity',
  class_code_id: 'academic-campaign-transaction-class-code',
  teach_id: 'academic-campaign-transaction-teach',
  calendar_id: 'academic-campaign-transaction-calendar',
  grade_id: 'academic-campaign-transaction-grade',
  detail_activity_id: 'academic-student-campaign-detail-activity',
  bundle_id: 'academic-survey-master-bundle',
  question_id: 'academic-survey-master-question',
  country_id: 'location-country',
  province_id: 'location-province',
  regency_id: 'location-regency',
  sub_district_id: 'location-sub-district',
  village_id: 'location-village',
};

export interface RelatedSpec {
  /** The resource that lists the related records. */
  key: string;
  /** Its field that holds this record's id. */
  field: string;
}

const T = 'academic-campaign-transaction';

/** Resource key -> related lists shown under its detail page. */
export const RELATED: Record<string, RelatedSpec[]> = {
  [`${T}-activity`]: [{ key: `${T}-teach`, field: 'activity_id' }, { key: `${T}-class-code`, field: 'activity_id' }],
  [`${T}-teach`]: [{ key: `${T}-teach-lecturer`, field: 'teach_id' }, { key: `${T}-teach-evaluation`, field: 'teach_id' }, { key: `${T}-schedule`, field: 'teach_id' }],
  [`${T}-class-code`]: [{ key: `${T}-teach`, field: 'class_code_id' }],
  [`${T}-calendar`]: [{ key: `${T}-calendar-detail`, field: 'calendar_id' }],
  'academic-course-master-course': [
    { key: 'academic-course-master-curriculum-detail', field: 'course_id' },
    { key: 'academic-course-master-course-learn-planning', field: 'course_id' },
    { key: 'academic-course-master-course-evaluation-planning', field: 'course_id' },
  ],
  'academic-course-master-curriculum': [{ key: 'academic-course-master-curriculum-detail', field: 'curriculum_id' }],
  'academic-candidate-master-candidate': [
    { key: 'academic-candidate-transaction-exam', field: 'candidate_id' },
    { key: 'academic-candidate-transaction-document', field: 'candidate_id' },
    { key: 'academic-candidate-transaction-candidate-unit-choice', field: 'candidate_id' },
    { key: 'academic-candidate-master-candidate-unit', field: 'candidate_id' },
  ],
  'academic-student-master-student': [
    { key: 'academic-student-campaign-student-activity', field: 'student_id' },
    { key: 'academic-student-adviser-counsellor', field: 'student_id' },
    { key: 'academic-student-master-image', field: 'student_id' },
  ],
  'academic-lecturer-master-lecturer': [{ key: `${T}-teach-lecturer`, field: 'lecturer_id' }],
  'academic-survey-master-bundle': [{ key: 'academic-survey-master-bundle-question', field: 'bundle_id' }],
  'academic-survey-master-question': [{ key: 'academic-survey-master-answer', field: 'question_id' }],
  unit: [{ key: 'staff', field: 'unit_id' }, { key: 'academic-student-master-student', field: 'unit_id' }],
};
