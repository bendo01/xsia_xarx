// Pure joins for the activity detail and enrollment pages. The Rust API returns
// flat rows keyed by ids (teaches, class codes, lecturers, schedules, rooms,
// courses, grades); the pages need them stitched together. This is the old
// client's in-browser join, moved server-side and made testable.
import { asList } from './student-select';
import type { EnrolledCourse, Lecturer, OfferedClass } from './enrollment-types';

type Raw = Record<string, any>;

export { asList };

/** Names the backend fills with a placeholder when a lecturer has no real name. */
export const cleanName = (v?: string | null): string =>
  !v || v.startsWith('DosenAktifitasPengajaran') ? '' : v.trim();

export const lecturerLabel = (l: Lecturer): string =>
  l.code && l.name ? `${l.code} - ${l.name}` : l.name || l.code || '';

/** "Kelas A" -> "A"; prefers the explicit alphabet code. */
export function classLetter(cc?: Raw | null): string {
  if (!cc) return '-';
  if (typeof cc.alphabet_code === 'string' && cc.alphabet_code.trim()) return cc.alphabet_code.trim();
  if (typeof cc.name === 'string' && cc.name.trim()) {
    const parts = cc.name.trim().split(/\s+/);
    const last = parts[parts.length - 1];
    return last && last.length <= 8 ? last : cc.name;
  }
  return cc.code || '-';
}

const byId = (rows: Raw[]) => new Map(rows.filter((r) => r?.id).map((r) => [r.id as string, r]));
const credit = (c?: Raw | null): number => Number(c?.total_credit ?? c?.credit ?? 0) || 0;

export interface OfferingInput {
  /** The unit activity this semester belongs to (student activity's unit_activity_id, else its own id). */
  activityId: string;
  /** The student's unit (programme); classes of other units are filtered out. */
  unitId?: string | null;
  campaignUnitId?: string | null;
  decreeIds: Set<string>;
  teaches: Raw[];
  courses: Raw[];
  classCodes: Raw[];
  teachLecturers: Raw[];
  lecturers: Raw[];
  schedules: Raw[];
  rooms: Raw[];
}

/** Classes this student may enrol in, with course, class letter, lecturers, schedule and room joined in. */
export function buildOfferings(input: OfferingInput): OfferedClass[] {
  const courses = byId(input.courses);
  const classCodes = byId(input.classCodes);
  const lecturers = byId(input.lecturers);
  const rooms = byId(input.rooms);

  const offered = input.teaches.filter((t) => {
    const onThisActivity =
      t.activity_id === input.activityId || (t.teach_decree_id && input.decreeIds.has(t.teach_decree_id));
    if (!onThisActivity) return false;
    if (input.unitId) {
      const teachUnit = t.unit_id || courses.get(t.course_id)?.unit_id || input.campaignUnitId;
      // A class of another unit is hidden unless it is tied to this very activity.
      if (teachUnit && teachUnit !== input.unitId && !t.activity_id) return false;
    }
    return true;
  });

  return offered.map((t): OfferedClass => {
    const course = courses.get(t.course_id);

    const lecturerNames = input.teachLecturers
      .filter((tl) => tl.teach_id === t.id)
      .map((tl) => {
        const lec = lecturers.get(tl.lecturer_id);
        const code = String(lec?.code ?? '').trim();
        const name = cleanName(lec?.name || tl.name || tl.lecturer_name);
        return lecturerLabel({ code, name });
      })
      .filter(Boolean)
      .join(', ');

    const schedules = input.schedules.filter((s) => s.teach_id === t.id);
    const scheduleTime = schedules
      .map((s) => (s.start_hour && s.end_hour ? `${String(s.start_hour).slice(0, 5)} - ${String(s.end_hour).slice(0, 5)}` : s.name || ''))
      .filter(Boolean)
      .join(', ');
    const roomNames = schedules
      .map((s) => rooms.get(s.room_id)?.name || s.room_name || '')
      .filter(Boolean)
      .join(', ');

    const letter = classLetter(classCodes.get(t.class_code_id));
    return {
      id: t.id,
      course_id: t.course_id,
      course_code: course?.code || t.course_code || '-',
      course_name: course?.name || t.course_name || t.name || '-',
      credits: credit(course) || Number(t.credits ?? 0) || 0,
      class_name: letter !== '-' ? letter : t.class_name || '-',
      lecturer_name: lecturerNames || t.lecturer_name || '-',
      schedule_time: scheduleTime || t.schedule_time || '-',
      room_name: roomNames || t.room_name || '-',
      enrolled_count: Number(t.enrolled_count ?? 0),
      max_member: Number(t.max_member ?? 40),
      is_lock: Boolean(t.is_lock),
    };
  });
}

export interface EnrolledLookups {
  courses: Map<string, Raw>;
  teaches: Map<string, Raw>;
  classCodes: Map<string, Raw>;
  grades: Map<string, Raw>;
}

/**
 * A student's detail activities (the courses on their study plan) with course,
 * grade and lecturer details. Embedded relations win; lookups fill the gaps.
 */
export function buildEnrolled(details: Raw[], lookups: EnrolledLookups): EnrolledCourse[] {
  return details.map((d): EnrolledCourse => {
    const course = d.course ?? lookups.courses.get(d.course_id);
    const teach = d.teach ?? (d.teach_id ? lookups.teaches.get(d.teach_id) : undefined);
    const grade = d.grade ?? (d.grade_id ? lookups.grades.get(d.grade_id) : undefined);
    const cc = teach ? lookups.classCodes.get(teach.class_code_id) : undefined;

    const embedded: any[] = Array.isArray(d.teach_lecturers) ? d.teach_lecturers : [];
    let lecturers: Lecturer[] = embedded
      .map((tl) => ({
        code: String(tl.code || tl.lecturer_code || tl.lecturer?.code || '').trim(),
        name: cleanName(tl.name || tl.lecturer_name || tl.lecturer?.name || (typeof tl === 'string' ? tl : '')),
      }))
      .filter((l) => l.name || l.code);
    if (lecturers.length === 0) {
      const name = cleanName(teach?.lecturer_name || d.lecturer_name);
      const code = String(teach?.lecturer_code || d.lecturer_code || '').trim();
      if (name || code) lecturers = [{ code, name }];
    }

    const letter = classLetter(cc);
    const point = grade?.grade ?? d.grade_point;
    return {
      id: d.id,
      course_id: d.course_id,
      teach_id: d.teach_id && d.teach_id !== '00000000-0000-0000-0000-000000000000' ? d.teach_id : null,
      course_code: course?.code || d.course_code || teach?.course_code || '-',
      course_name: course?.name || d.course_name || d.name || teach?.course_name || '-',
      class_name: letter !== '-' ? letter : teach?.class_name || '-',
      credit: Number(d.credit ?? credit(course) ?? teach?.credits ?? 0) || 0,
      lecturers,
      mark: d.mark != null ? Number(d.mark) : null,
      grade_letter: grade?.alphabet_code || grade?.name || d.grade_letter || '-',
      grade_point: point != null ? Number(point) : null,
      is_lock: Boolean(d.is_lock),
      class_locked: Boolean(teach?.is_lock),
    };
  });
}
