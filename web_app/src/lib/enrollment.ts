// Data layer for the semester activity detail and KRS enrollment pages.
// Reads are query()s; changes are plain server functions the pages call from
// handlers (the router revalidates the queries once they settle).
import { query } from '@solidjs/router';

import { dropFromPlan, enrollInClass, loadActivityDetail, loadEnrollment } from '../server/enrollment';
import { requireAuth } from '../server/auth';

export const getActivityDetail = query(async (activityId: string) => {
  'use server';
  return loadActivityDetail(await requireAuth(), activityId);
}, 'activity-detail');

export const getEnrollment = query(async (activityId: string) => {
  'use server';
  return loadEnrollment(await requireAuth(), activityId);
}, 'enrollment');

/** Throws a safe Error whose message is a rule code (see EnrollBlock) the UI translates. */
export async function enroll(activityId: string, teachId: string): Promise<void> {
  'use server';
  await enrollInClass(await requireAuth(), activityId, teachId);
}

export async function dropCourse(activityId: string, detailId: string): Promise<void> {
  'use server';
  await dropFromPlan(await requireAuth(), activityId, detailId);
}
