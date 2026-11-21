// Server side of the activity detail and KRS enrollment pages: aggregates the
// API's flat lists into what the pages show, and applies study-plan changes.
//
// Two things differ from the old browser code on purpose:
//  * Every call first proves the semester activity belongs to the signed-in
//    person (an administrator excepted): ids in a URL are not authorisation.
//  * Enrol / drop are decided here. The old client checked the credit cap,
//    duplicates and the lock in the browser and POSTed a client-chosen credit.
import { markSafeError } from '@solidjs/web';

import { buildEnrolled, buildOfferings, asList, type EnrolledLookups } from '../lib/enrollment-build';
import { enrollBlocker } from '../lib/enrollment-rules';
import type { ActivityDetail, ActivityHeader, EnrollBlock, EnrollmentData } from '../lib/enrollment-types';
import { isUuid } from '../lib/validation';
import { apiFetch } from './api';
import type { AuthState } from './auth';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const ZERO = '00000000-0000-0000-0000-000000000000';

const safe = (message: string) => markSafeError(new Error(message));

/** One entity from a "show" endpoint, unwrapping an optional {data} envelope. */
const unwrap = (r: unknown): Raw | null => {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const o = r as Raw;
  return o.data && typeof o.data === 'object' && !Array.isArray(o.data) ? o.data : o;
};
const showOrNull = (path: string) => apiFetch<unknown>(path).then(unwrap).catch(() => null);
/** Auxiliary lists never fail the page; a missing list just leaves columns blank. */
const listOrEmpty = (path: string, query: Record<string, string | number | undefined>) =>
  apiFetch<unknown>(path, { query }).then((r) => asList<Raw>(r)).catch(() => [] as Raw[]);

function toHeader(a: Raw): ActivityHeader {
  return {
    id: a.id,
    name: a.name ?? null,
    student_id: a.student_id,
    unit_activity_id: a.unit_activity_id ?? null,
    unit_id: a.unit_id ?? null,
    is_lock: Boolean(a.is_lock),
    cumulative_index: Number(a.cumulative_index ?? 0),
    grand_cumulative_index: Number(a.grand_cumulative_index ?? 0),
    total_credit: Number(a.total_credit ?? 0),
    grand_total_credit: Number(a.grand_total_credit ?? 0),
    academic_year: a.academic_year ?? null,
    academic_year_name: a.academic_year_name,
    semester_name: a.semester_name,
  };
}

/** The activity, once it is proven to be the caller's own. Anything else reads as "not found". */
export async function loadOwnActivity(auth: AuthState, activityId: string) {
  if (!isUuid(activityId) || activityId === ZERO) throw safe('NOT_FOUND');
  const raw = unwrap(await apiFetch<unknown>(`academic/student/campaign/student-activities/${enc(activityId)}`).catch(() => null));
  if (!raw?.id) throw safe('NOT_FOUND');

  const student = await showOrNull(`academic/student/master/students/${enc(raw.student_id)}`);
  const mine = student?.individual_id && student.individual_id === auth.user?.individual_id;
  if (!mine && auth.activeRole !== 'administrator') throw safe('NOT_FOUND');
  return { activity: toHeader(raw), student };
}

const uniqueIds = (ids: (string | null | undefined)[]) => [...new Set(ids.filter((i): i is string => !!i && i !== ZERO))];
const missing = (ids: (string | null | undefined)[], have: Map<string, Raw>) => uniqueIds(ids).filter((i) => !have.has(i));

async function fetchById(base: string, ids: string[]): Promise<Map<string, Raw>> {
  const found = await Promise.all(ids.map(async (id) => [id, await showOrNull(`${base}/${enc(id)}`)] as const));
  return new Map(found.filter((e): e is [string, Raw] => !!e[1]));
}

/** The study plan's courses for an activity, newest API rows first as returned. */
async function loadDetails(activityId: string): Promise<Raw[]> {
  const res = await apiFetch<unknown>('academic/student/campaign/detail-activities', {
    query: { page: 1, page_size: 100, activity_id: activityId },
  });
  return asList<Raw>(res).filter((d) => d.activity_id === activityId);
}

export async function loadActivityDetail(auth: AuthState, activityId: string): Promise<ActivityDetail> {
  const { activity } = await loadOwnActivity(auth, activityId);
  return buildActivityDetail(activity);
}

/**
 * A student's semester as seen by the study program that owns it. The activity must belong to
 * `unitId`: by the activity's own unit, else by the unit of its student.
 */
export async function loadUnitActivityDetail(unitId: string, activityId: string): Promise<ActivityDetail> {
  if (!isUuid(activityId) || activityId === ZERO) throw safe('NOT_FOUND');
  const raw = unwrap(await apiFetch<unknown>(`academic/student/campaign/student-activities/${enc(activityId)}`).catch(() => null));
  if (!raw?.id) throw safe('NOT_FOUND');
  const owner = raw.unit_id || (await showOrNull(`academic/student/master/students/${enc(raw.student_id)}`))?.unit_id;
  if (owner !== unitId) throw safe('NOT_FOUND');
  return buildActivityDetail(toHeader(raw));
}

async function buildActivityDetail(activity: ActivityDetail['activity']): Promise<ActivityDetail> {
  const details = await loadDetails(activity.id);
  // Prefer relations the API embeds; look up only what is missing (by id, not by
  // fetching whole 100-row lists as the old page did, which silently missed rows).
  const noCourse = details.filter((d) => !d.course);
  const noGrade = details.filter((d) => !d.grade);
  const noTeach = details.filter((d) => !d.teach);
  const [courses, grades, teaches] = await Promise.all([
    fetchById('academic/course/master/courses', uniqueIds(noCourse.map((d) => d.course_id))),
    fetchById('academic/campaign/transaction/grades', uniqueIds(noGrade.map((d) => d.grade_id))),
    fetchById('academic/campaign/transaction/teaches', uniqueIds(noTeach.map((d) => d.teach_id))),
  ]);
  const classCodes = await fetchById(
    'academic/campaign/transaction/class-codes',
    uniqueIds([...teaches.values()].map((t) => t.class_code_id)),
  );
  const lookups: EnrolledLookups = { courses, grades, teaches, classCodes };
  return { activity, courses: buildEnrolled(details, lookups) };
}

/**
 * Classes of a semester: those on the activity itself, those hanging off its
 * decrees, and (only when there are none of either) everything on offer, as the
 * old page did. Shared by the enrollment page and the realtime relay so both
 * mean the same set of classes.
 */
async function loadTeaches(targetActivityId: string): Promise<{ teaches: Raw[]; decrees: Raw[] }> {
  const [activityTeaches, decrees] = await Promise.all([
    listOrEmpty('academic/campaign/transaction/teaches', { page: 1, page_size: 300, activity_id: targetActivityId }),
    listOrEmpty('academic/campaign/transaction/teach-decrees', { page_size: 100, activity_id: targetActivityId }),
  ]);
  const decreeTeaches = (
    await Promise.all(decrees.map((d) => listOrEmpty('academic/campaign/transaction/teaches', { page: 1, page_size: 300, teach_decree_id: d.id })))
  ).flat();
  const general =
    activityTeaches.length === 0 && decreeTeaches.length === 0
      ? await listOrEmpty('academic/campaign/transaction/teaches', { page: 1, page_size: 300 })
      : [];
  const byId = new Map<string, Raw>();
  for (const t of [...activityTeaches, ...decreeTeaches, ...general]) byId.set(t.id, t);
  return { teaches: [...byId.values()], decrees };
}

export async function loadEnrollment(auth: AuthState, activityId: string): Promise<EnrollmentData> {
  const { activity, student } = await loadOwnActivity(auth, activityId);

  const targetActivityId = activity.unit_activity_id || activity.id;
  const unitId: string | null = student?.unit_id ?? activity.unit_id ?? null;
  const campaignActivity = activity.unit_activity_id
    ? await showOrNull(`academic/campaign/transaction/activities/${enc(activity.unit_activity_id)}`)
    : null;

  const [{ teaches: allTeaches, decrees }, classCodeList, teachLecturers, lecturers, schedules, rooms, unitCourses, details] =
    await Promise.all([
      loadTeaches(targetActivityId),
      listOrEmpty('academic/campaign/transaction/class-codes', { page_size: 500 }),
      listOrEmpty('academic/campaign/transaction/teach-lecturers', { page_size: 500 }),
      listOrEmpty('academic/lecturer/master/lecturers', { page_size: 300 }),
      listOrEmpty('academic/campaign/transaction/schedules', { page_size: 300 }),
      listOrEmpty('building/master/rooms', { page_size: 300 }),
      unitId ? listOrEmpty('academic/course/master/courses', { page_size: 500, unit_id: unitId }) : Promise.resolve([] as Raw[]),
      loadDetails(activity.id),
    ]);

  // Courses and class codes outside the unit's list (shared/university courses) are fetched by id.
  const courseMap = new Map(unitCourses.filter((c) => c?.id).map((c) => [c.id as string, c]));
  const classCodeMap = new Map(classCodeList.filter((c) => c?.id).map((c) => [c.id as string, c]));
  const [extraCourses, extraClassCodes] = await Promise.all([
    fetchById('academic/course/master/courses', missing([...allTeaches.map((t) => t.course_id), ...details.map((d) => d.course_id)], courseMap)),
    fetchById('academic/campaign/transaction/class-codes', missing(allTeaches.map((t) => t.class_code_id), classCodeMap)),
  ]);
  extraCourses.forEach((v, k) => courseMap.set(k, v));
  extraClassCodes.forEach((v, k) => classCodeMap.set(k, v));

  const offerings = buildOfferings({
    activityId: targetActivityId,
    unitId,
    campaignUnitId: campaignActivity?.unit_id ?? null,
    decreeIds: new Set(decrees.map((d) => d.id as string)),
    teaches: allTeaches,
    courses: [...courseMap.values()],
    classCodes: [...classCodeMap.values()],
    teachLecturers,
    lecturers,
    schedules,
    rooms,
  });

  const enrolled = buildEnrolled(details, {
    courses: courseMap,
    teaches: new Map(allTeaches.map((t) => [t.id as string, t])),
    classCodes: classCodeMap,
    grades: new Map(),
  });
  return { activity, enrolled, offerings };
}

/** Enrol in a class. The rules and the credit come from the server's own view of the data. */
export async function enrollInClass(auth: AuthState, activityId: string, teachId: string): Promise<void> {
  if (!isUuid(teachId)) throw safe('NOT_OFFERED' satisfies EnrollBlock);
  const { activity, enrolled, offerings } = await loadEnrollment(auth, activityId);
  const offering = offerings.find((o) => o.id === teachId);

  const block = enrollBlocker({ locked: activity.is_lock, enrolled, offering });
  if (block) throw safe(block);

  await apiFetch('academic/student/campaign/detail-activities', {
    method: 'POST',
    body: {
      name: offering!.course_name,
      credit: offering!.credits, // never the caller's number
      course_id: offering!.course_id,
      activity_id: activity.id,
      teach_id: offering!.id,
      grade_id: ZERO,
      feeder_grade_id: ZERO,
      curiculum_detail_sequence: 0,
      mark: 0,
      is_lock: false,
    },
  });
}

/** Remove a course from the study plan (only while the semester is open). */
export async function dropFromPlan(auth: AuthState, activityId: string, detailId: string): Promise<void> {
  if (!isUuid(detailId)) throw safe('NOT_FOUND');
  const { activity } = await loadOwnActivity(auth, activityId);
  if (activity.is_lock) throw safe('LOCKED' satisfies EnrollBlock);

  // The row must be on THIS activity: a detail id from someone else's plan is refused.
  const details = await loadDetails(activity.id);
  const row = details.find((d) => d.id === detailId);
  if (!row) throw safe('NOT_FOUND');

  // A class the study program has locked cannot be dropped any more (the API refuses it too).
  if (row.teach_id && row.teach_id !== ZERO) {
    const teach = row.teach ?? unwrap(await apiFetch<unknown>(`academic/campaign/transaction/teaches/${enc(row.teach_id)}`).catch(() => null));
    if (teach?.is_lock) throw safe('CLASS_LOCKED' satisfies EnrollBlock);
  }

  await apiFetch(`academic/student/campaign/detail-activities/${enc(detailId)}`, { method: 'DELETE' });
}

/** Most channels one connection may listen on (a semester offers far fewer classes). */
const MAX_CHANNELS = 300;

/**
 * What the realtime relay subscribes to for a semester: the student's own plan
 * (`activity:`) and the seat counts of the classes on offer (`teach:`). Only for
 * the owner of the semester, like every other read here.
 */
export async function loadRealtimeChannels(auth: AuthState, activityId: string): Promise<string[]> {
  const { activity } = await loadOwnActivity(auth, activityId);
  const { teaches } = await loadTeaches(activity.unit_activity_id || activity.id);
  return [`activity:${activity.id}`, ...teaches.map((t) => t.id as string).filter(isUuid).map((id) => `teach:${id}`)].slice(0, MAX_CHANNELS);
}
