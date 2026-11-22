// Pure helpers of the administrator's individual profile page.

/** Body mass index (kg/m²) from a height in cm (a value up to 3 is read as metres) and a weight in kg; null if not computable. */
export function bmi(height: number, weight: number): number | null {
  if (!(height > 0) || !(weight > 0)) return null;
  const m = height <= 3 ? height : height / 100;
  return Math.round((weight / (m * m)) * 10) / 10;
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

/** WHO adult categories. */
export function bmiCategory(value: number): BmiCategory {
  return value < 18.5 ? 'underweight' : value < 25 ? 'normal' : value < 30 ? 'overweight' : 'obese';
}

/** "Dr. Siti Aminah, M.Sc." from the parts that exist. */
export function fullName(front: unknown, name: unknown, last: unknown): string {
  const f = String(front ?? '').trim();
  const l = String(last ?? '').trim();
  const n = String(name ?? '').trim();
  return [f, l ? `${n},` : n, l].filter(Boolean).join(' ');
}

/** Whole years between a birth date ("YYYY-MM-DD") and `now`; null for an invalid date or one in the future. */
export function ageOn(birthDate: unknown, now = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(birthDate ?? ''));
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let years = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < mo || (now.getUTCMonth() + 1 === mo && now.getUTCDate() < d)) years -= 1;
  return years >= 0 ? years : null;
}

/** The reference tables an individual points to: field -> endpoint. */
export const INDIVIDUAL_REFERENCES: Record<string, string> = {
  gender_id: 'person/reference/gender',
  religion_id: 'person/reference/religion',
  occupation_id: 'person/reference/occupation',
  income_id: 'person/reference/income',
  identification_type_id: 'person/reference/identification-type',
  marital_status_id: 'person/reference/marital-status',
  profession_id: 'person/reference/profession',
  age_classification_id: 'person/reference/age-classification',
  education_id: 'educations',
};

/** The reference tables of the body measurements: field -> endpoint. */
export const BIODATA_REFERENCES: Record<string, string> = {
  blood_type_id: 'person/reference/blood-type',
  hair_type_id: 'person/reference/hair-type',
  hair_color_id: 'person/reference/hair-color',
  eye_color_id: 'person/reference/eye-color',
};

/** Records of other areas that point at an individual: where to list them and where their detail pages are. */
export const INDIVIDUAL_LINKS = [
  { key: 'students', api: 'academic/student/master/students', filter: 'individual_id', page: 'academic/student/master/student', label: 'ad.student' },
  { key: 'lecturers', api: 'academic/lecturer/master/lecturers', filter: 'individual_id', page: 'academic/lecturer/master/lecturer', label: 'ad.lecturer' },
  { key: 'employees', api: 'institution/master/employees', filter: 'individual_id', page: 'institution/master/employee', label: 'ad.employee' },
  { key: 'candidates', api: 'academic/candidate/master/candidates', filter: 'individual_id', page: 'academic/candidate/master/candidate', label: 'ad.candidate' },
] as const;
