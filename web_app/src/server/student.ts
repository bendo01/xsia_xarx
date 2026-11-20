// Aggregates what the student home page needs. The old client made 4 + N
// sequential browser calls (individual, one per student identity, activities,
// advisers); here it is one round trip and the token never leaves the server.
import { apiFetch, apiPaginated } from './api';
import { buildTrend, chronological, toDetailStat, type DetailStat } from '../lib/academic-trend';
import { asList, pickStudent, shapeIndividual } from '../lib/student-select';
import type { ActivityItem, CounsellorItem, StudentItem, StudentProfile } from '../lib/student-types';

const enc = encodeURIComponent;

type Choice = { studentId?: string | null; code?: string | null; preferredId?: string | null };

/** The individual's body plus their student identities (enriched) and the one to show. */
export async function loadIdentities(individualId: string, choice: Choice) {
  const raw = await apiFetch<Record<string, unknown>>(`person/master/individual/${enc(individualId)}`);
  const base = shapeIndividual(raw);

  // The embedded student rows are thin; the single-student endpoint adds unit/status/curriculum.
  const students: StudentItem[] = await Promise.all(
    base.students.map(async (s) => {
      try {
        return (await apiFetch<StudentItem>(`academic/student/master/students/${enc(s.id)}`)) ?? s;
      } catch {
        return s;
      }
    }),
  );
  return { base, students, selected: pickStudent(students, choice) };
}

export async function loadStudentProfile(individualId: string, choice: Choice): Promise<StudentProfile> {
  const { base, students, selected } = await loadIdentities(individualId, choice);

  let activities: ActivityItem[] = [];
  let advisers: CounsellorItem[] = [];
  if (selected) {
    // Sub-records are secondary: a failure leaves that section empty, not the page broken.
    const [act, adv] = await Promise.all([
      apiFetch<unknown>('academic/student/campaign/student-activities', {
        query: { student_id: selected.id, page: 1, page_size: 50 },
      }).catch(() => null),
      apiFetch<unknown>('academic/student/adviser/counsellors', {
        query: { student_id: selected.id, page: 1, page_size: 10 },
      }).catch(() => null),
    ]);
    activities = asList<ActivityItem>(act);
    advisers = asList<CounsellorItem>(adv);
  }

  // Course rows of the 10 latest semesters make the GPA trend exact (as the old page did);
  // older ones fall back to the semester's own fields. A failure just means coarser numbers.
  const latest = chronological(activities).slice(-10);
  const details: DetailStat[] = (
    await Promise.all(
      latest.map((a) =>
        apiFetch<unknown>('academic/student/campaign/detail-activities', {
          query: { page: 1, page_size: 100, activity_id: a.id },
        })
          .then((r) => asList<Record<string, any>>(r).filter((d) => d.activity_id === a.id).map(toDetailStat))
          .catch(() => [] as DetailStat[]),
      ),
    )
  ).flat();

  return { ...base, students, selected, activities, advisers, trend: buildTrend(activities, details) };
}

/** One page of a student's semester activities (newest first as the API returns them). */
export async function loadActivityPage(studentId: string, page: number, pageSize = 10) {
  return apiPaginated<ActivityItem>('academic/student/campaign/student-activities', {
    page,
    per_page: pageSize,
    student_id: studentId,
  });
}

export async function loadCounsellorPage(page: number, pageSize = 20) {
  return apiPaginated<CounsellorItem>('academic/student/adviser/counsellors', { page, per_page: pageSize });
}

export async function loadStudentDirectory(individualId: string, page: number, search: string, pageSize = 10) {
  const res = await apiPaginated<StudentItem>('academic/student/master/students', {
    page,
    per_page: pageSize,
    search,
    individual_id: individualId,
  });
  // Defence in depth: the list is "my identities", whatever a loose filter returned.
  return { ...res, data: res.data.filter((s) => !s.individual_id || s.individual_id === individualId) };
}
