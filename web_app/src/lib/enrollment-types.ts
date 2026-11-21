// Shapes for the semester activity detail and course enrollment (KRS) pages.
import type { NamedRef } from './student-types';

export interface ActivityHeader {
  id: string;
  name?: string | null;
  student_id: string;
  unit_activity_id?: string | null;
  unit_id?: string | null;
  is_lock: boolean;
  cumulative_index: number;
  grand_cumulative_index: number;
  total_credit: number;
  grand_total_credit: number;
  academic_year?: NamedRef | null;
  academic_year_name?: string;
  semester_name?: string;
}

export interface Lecturer {
  code?: string;
  name: string;
}

/** A course the student has taken in this semester (a "detail activity"). */
export interface EnrolledCourse {
  id: string;
  course_id: string;
  teach_id: string | null;
  course_code: string;
  course_name: string;
  class_name: string;
  credit: number;
  lecturers: Lecturer[];
  mark: number | null;
  grade_letter: string;
  grade_point: number | null;
  is_lock: boolean;
  /** The class itself is locked by the study program (cannot be dropped). */
  class_locked?: boolean;
}

/** A class (teach) that can be enrolled in this semester. */
export interface OfferedClass {
  id: string;
  course_id: string;
  course_code: string;
  course_name: string;
  credits: number;
  class_name: string;
  lecturer_name: string;
  schedule_time: string;
  room_name: string;
  enrolled_count: number;
  max_member: number;
  /** The study program closed this class (teaching class lock). */
  is_lock?: boolean;
}

export interface ActivityDetail {
  activity: ActivityHeader;
  courses: EnrolledCourse[];
}

export interface EnrollmentData {
  activity: ActivityHeader;
  enrolled: EnrolledCourse[];
  offerings: OfferedClass[];
}

/** Codes the server answers with when a rule blocks a change; the UI translates them. */
export type EnrollBlock =
  | 'NOT_OFFERED'
  | 'LOCKED'
  | 'CLASS_LOCKED'
  | 'ALREADY_ENROLLED'
  | 'DUPLICATE_COURSE'
  | 'FULL'
  | 'CREDIT_LIMIT';
