// Unit (study program) data layer for the course-department role.
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadUnitActivityDetail } from '../server/enrollment';
import { loadStudentProfile } from '../server/student';
import {
  loadAcademicYearOptions, loadStudentFilters, loadUnitActivityOptions, loadUnitActivities, loadUnitDashboard, loadUnitLecturers,
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
  return { students: await loadUnitStudents(unitId, { page, search, yearId, statusId, sort }) };
}, 'unit-students');

/** The year and status options of the student filter: loaded once, not with every page of the list. */
export const getUnitStudentFilters = query(async () => {
  'use server';
  return loadStudentFilters(await resolveMyUnit(await requireAuth()));
}, 'unit-student-filters');

/** My unit's activities (semesters) for the classes filter: loaded once, not with every page. */
export const getUnitActivityOptions = query(async () => {
  'use server';
  return loadUnitActivityOptions(await resolveMyUnit(await requireAuth()));
}, 'unit-activity-options');

/** Academic years for the filters (the same for everyone): one request, reused across pages. */
export const getAcademicYears = query(async () => {
  'use server';
  await requireAuth();
  return loadAcademicYearOptions();
}, 'academic-years');

export const getUnitActivities = query(async (page: number, search: string, yearId: string, sort: string) => {
  'use server';
  const unitId = await resolveMyUnit(await requireAuth());
  return { activities: await loadUnitActivities(unitId, { page, search, yearId, sort }) };
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
