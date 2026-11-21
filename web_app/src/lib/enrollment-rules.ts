// Business rules for KRS enrollment. The old client enforced these in the
// browser and POSTed a client-chosen credit; here the server enforces them and
// derives the credit itself, and the UI uses the same functions to disable
// buttons, so the two can never disagree.
import type { EnrollBlock, EnrolledCourse, OfferedClass } from './enrollment-types';

/** Maximum credits (SKS) per semester, as in the old client. */
export const MAX_SKS = 24;

export const totalCredits = (courses: Pick<EnrolledCourse, 'credit'>[]): number =>
  courses.reduce((sum, c) => sum + (c.credit || 0), 0);

export function enrollBlocker(input: {
  locked: boolean;
  enrolled: Pick<EnrolledCourse, 'teach_id' | 'course_id' | 'credit'>[];
  offering: Pick<OfferedClass, 'id' | 'course_id' | 'credits' | 'enrolled_count' | 'max_member' | 'is_lock'> | undefined;
  max?: number;
}): EnrollBlock | null {
  const { locked, enrolled, offering, max = MAX_SKS } = input;
  if (!offering) return 'NOT_OFFERED';
  if (locked) return 'LOCKED';
  if (offering.is_lock) return 'CLASS_LOCKED';
  if (enrolled.some((c) => c.teach_id === offering.id)) return 'ALREADY_ENROLLED';
  if (enrolled.some((c) => c.course_id === offering.course_id)) return 'DUPLICATE_COURSE';
  if (offering.enrolled_count >= offering.max_member) return 'FULL';
  if (totalCredits(enrolled) + offering.credits > max) return 'CREDIT_LIMIT';
  return null;
}

/** Semester GPA (IPS): the API's value when present, else credit-weighted grade points. */
export function semesterIps(
  apiValue: number | null | undefined,
  courses: Pick<EnrolledCourse, 'credit' | 'grade_point'>[],
): number {
  if (apiValue != null) return apiValue;
  const credits = totalCredits(courses);
  if (credits <= 0) return 0;
  return courses.reduce((sum, c) => sum + (c.grade_point ?? 0) * (c.credit ?? 0), 0) / credits;
}

export type GradeTone = 'none' | 'a' | 'b' | 'c' | 'd' | 'e';

/** Colour bucket for a letter grade ("A", "B+", "-", ...). */
export function gradeTone(letter: string | null | undefined): GradeTone {
  const g = (letter ?? '').trim().toUpperCase();
  if (!g || g === '-') return 'none';
  const first = g[0];
  return first === 'A' ? 'a' : first === 'B' ? 'b' : first === 'C' ? 'c' : first === 'D' ? 'd' : 'e';
}
