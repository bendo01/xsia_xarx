// Lecturer data layer: server functions the pages call directly.
import { query } from '@solidjs/router';
import { markSafeError } from '@solidjs/web';

import { requireAuth } from '../server/auth';
import { loadLecturerProfile, loadLecturerRecord } from '../server/lecturer';
import { resolveIndividualId } from './student-select';

const preferredLecturer = (auth: Awaited<ReturnType<typeof requireAuth>>) =>
  auth.activeRole === 'lecturer' ? auth.activeRoleItem?.roleable_id : null;

/** Profile of an individual (route [id], or "me" for placeholders) with their lecturer record. */
export const getLecturerProfile = query(async (rawId: string) => {
  'use server';
  const auth = await requireAuth();
  const id = resolveIndividualId(rawId, auth.user?.individual_id);
  if (!id) throw markSafeError(new Error('Individual not found'));
  return loadLecturerProfile(id, preferredLecturer(auth));
}, 'lecturer-profile');

/** The signed-in lecturer's own record (classes, homebases, ranks, groups). */
export const getMyLecturer = query(async () => {
  'use server';
  const auth = await requireAuth();
  const id = resolveIndividualId('', auth.user?.individual_id);
  const profile = id ? await loadLecturerProfile(id, preferredLecturer(auth)) : null;
  return { name: profile?.individual.name ?? null, lecturer: profile?.lecturer ?? null };
}, 'lecturer-mine');

/** A lecturer record by id (master detail page). */
export const getLecturerById = query(async (lecturerId: string) => {
  'use server';
  await requireAuth();
  return loadLecturerRecord(lecturerId);
}, 'lecturer-by-id');
