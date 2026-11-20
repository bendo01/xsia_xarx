// Student data layer: server functions the pages call directly.
import { query } from '@solidjs/router';
import { markSafeError } from '@solidjs/web';

import {
  loadActivityPage,
  loadCounsellorPage,
  loadIdentities,
  loadStudentDirectory,
  loadStudentProfile,
} from '../server/student';
import { requireAuth } from '../server/auth';
import { resolveIndividualId } from './student-select';

/**
 * Profile for an individual (the route's [id], or "me" for placeholders), with
 * the selected student identity's activities and advisers. Access is enforced
 * by the Rust API's data scope; this layer only needs a signed-in caller.
 */
export const getStudentProfile = query(
  async (rawId: string, studentId?: string, code?: string) => {
    'use server';
    const auth = await requireAuth();
    const id = resolveIndividualId(rawId, auth.user?.individual_id);
    if (!id) throw markSafeError(new Error('Individual not found'));
    return loadStudentProfile(id, {
      studentId: studentId || null,
      code: code || null,
      // With a student role active, default to that role's own student identity.
      preferredId: auth.activeRole === 'student' ? auth.activeRoleItem?.roleable_id : null,
    });
  },
  'student-profile',
);

const mineOrThrow = async (rawId?: string) => {
  const auth = await requireAuth();
  const id = resolveIndividualId(rawId ?? '', auth.user?.individual_id);
  if (!id) throw markSafeError(new Error('Individual not found'));
  return { auth, id };
};
const preferredStudent = (auth: Awaited<ReturnType<typeof requireAuth>>) =>
  auth.activeRole === 'student' ? auth.activeRoleItem?.roleable_id : null;

/** The signed-in user's student identities, the selected one, and a page of its semester activities. */
export const getStudentActivities = query(
  async (studentId: string, code: string, page: number) => {
    'use server';
    const { auth, id } = await mineOrThrow();
    const { students, selected } = await loadIdentities(id, {
      studentId: studentId || null,
      code: code || null,
      preferredId: preferredStudent(auth),
    });
    const activities = selected ? await loadActivityPage(selected.id, page) : null;
    return { students, selected, activities };
  },
  'student-activities',
);

/** Advisers/counsellors assigned to the signed-in student (the API scopes the list). */
export const getCounsellors = query(async (page: number) => {
  'use server';
  await requireAuth();
  return loadCounsellorPage(page);
}, 'student-counsellors');

/** The signed-in user's own student records (the "admitted students" directory). */
export const getStudentDirectory = query(async (page: number, search: string) => {
  'use server';
  const { id } = await mineOrThrow();
  return loadStudentDirectory(id, page, search);
}, 'student-directory');
