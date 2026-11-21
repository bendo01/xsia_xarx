// Unit (study program) data layer for the course-department role.
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadUnitActivityDetail } from '../server/enrollment';
import { loadStudentProfile } from '../server/student';
import {
  loadAcademicYearOptions, loadStudentFilters, loadUnitActivities, loadUnitDashboard, loadUnitLecturers,
  loadUnitStaff, loadUnitStudent, loadUnitStudents, loadUnitTeach, loadUnitTeaches, resolveMyUnit,
} from '../server/unit';

export const getUnitDashboard = query(async (rawId: string) => {
  'use server';
  const auth = await requireAuth();
  return loadUnitDashboard(await resolveMyUnit(auth, rawId));
}, 'unit-dashboard');

/** My unit's students (filters in the URL) plus the options for the filter selects. */
export const getUnitStudents = query(async (page: number, search: string, yearId: string, statusId: string, sort: string) => {
  'use server';
  const unitId = await resolveMyUnit(await requireAuth());
  const [students, filters] = await Promise.all([
    loadUnitStudents(unitId, { page, search, yearId, statusId, sort }),
    loadStudentFilters(unitId),
  ]);
  return { students, ...filters };
}, 'unit-students');

export const getUnitActivities = query(async (page: number, search: string, yearId: string, sort: string) => {
  'use server';
  const unitId = await resolveMyUnit(await requireAuth());
  const [activities, years] = await Promise.all([
    loadUnitActivities(unitId, { page, search, yearId, sort }),
    loadAcademicYearOptions(),
  ]);
  return { activities, years };
}, 'unit-activities');

export const getUnitActivityDetail = query(async (activityId: string) => {
  'use server';
  return loadUnitActivityDetail(await resolveMyUnit(await requireAuth()), activityId);
}, 'unit-activity-detail');

export const getUnitLecturers = query(async (page: number, search: string) => {
  'use server';
  const unitId = await resolveMyUnit(await requireAuth());
  return loadUnitLecturers(unitId, page, search);
}, 'unit-lecturers');

/** A student of my unit with the full profile (identities, semesters, advisers, trend). */
export const getUnitStudentProfile = query(async (studentId: string) => {
  'use server';
  const unitId = await resolveMyUnit(await requireAuth());
  const s = await loadUnitStudent(unitId, studentId);
  return loadStudentProfile(s.individual_id, { studentId: s.id });
}, 'unit-student-profile');

export const getUnitTeaches = query(async (page: number, search: string, activityId: string, lock: string) => {
  'use server';
  const unitId = await resolveMyUnit(await requireAuth());
  return loadUnitTeaches(unitId, { page, search, activityId, lock });
}, 'unit-teaches');

export const getUnitTeach = query(async (teachId: string) => {
  'use server';
  return loadUnitTeach(await resolveMyUnit(await requireAuth()), teachId);
}, 'unit-teach');

export const getUnitStaff = query(async (page: number, search: string) => {
  'use server';
  return loadUnitStaff(await resolveMyUnit(await requireAuth()), page, search);
}, 'unit-staff');
