// Institution data layer for the rectorat role (read-only).
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadFeederPage } from '../server/feeder';
import { listRecords } from '../server/crud';
import {
  loadInstitutionAnalytics, loadInstitutionProgram, loadInstitutionCandidates, loadInstitutionEmployees, loadInstitutionStudent, loadInstitutionStudentActivities, loadInstitutionSummary, loadInstitutionStudents, loadInstitutionUnits, resolveInstitutionUnit, resolveMyInstitution,
} from '../server/institution';
import { loadAcademicYearOptions, loadUnitLecturers, loadUnitTeaches } from '../server/unit';
import { loadStudentProfile } from '../server/student';
import type { TopKey } from './crud-schema';
import { parsePageSize } from './url';

export const getInstitutionUnits = query(async (rawId: string, page: number, search: string) => {
  'use server';
  const id = resolveMyInstitution(await requireAuth(), rawId);
  return loadInstitutionUnits(id, page, search);
}, 'institution-units');

export const getInstitutionStudents = query(async (rawId: string, page: number, search: string, sort: string, size: number) => {
  'use server';
  const id = resolveMyInstitution(await requireAuth(), rawId);
  return loadInstitutionStudents(id, { page, search, sort }, parsePageSize(size));
}, 'institution-students');

export const getInstitutionStudentActivities = query(async (rawId: string, page: number, search: string, yearId: string, size: number) => {
  'use server';
  const id = resolveMyInstitution(await requireAuth(), rawId);
  const [activities, years] = await Promise.all([
    loadInstitutionStudentActivities(id, { page, search, yearId, sort: '' }, parsePageSize(size)),
    loadAcademicYearOptions(),
  ]);
  return { activities, years };
}, 'institution-student-activities');

/** Directories the API can only filter by unit: `unit` picks one of the institution's own units. */
export const getInstitutionLecturers = query(async (rawId: string, unit: string, page: number, search: string, size: number) => {
  'use server';
  const { unitId, units } = await resolveInstitutionUnit(resolveMyInstitution(await requireAuth(), rawId), unit);
  return { unitId, units, lecturers: await loadUnitLecturers(unitId, page, search, parsePageSize(size)) };
}, 'institution-lecturers');

export const getInstitutionTeaches = query(async (rawId: string, unit: string, page: number, search: string, activityId: string, lock: string, size: number) => {
  'use server';
  const { unitId, units } = await resolveInstitutionUnit(resolveMyInstitution(await requireAuth(), rawId), unit);
  return { unitId, units, teaches: await loadUnitTeaches(unitId, { page, search, activityId, lock }, parsePageSize(size)) };
}, 'institution-teaches');

export const INSTITUTION_RECORD_KEYS = ['course', 'curriculum', 'activity', 'classCode', 'grade', 'staff'] as const satisfies readonly TopKey[];
export type InstitutionRecordKey = (typeof INSTITUTION_RECORD_KEYS)[number];

export const getInstitutionRecords = query(async (rawId: string, key: InstitutionRecordKey, unit: string, page: number, search: string, size: number) => {
  'use server';
  if (!INSTITUTION_RECORD_KEYS.includes(key)) throw new Error('Not found');
  const { unitId, units } = await resolveInstitutionUnit(resolveMyInstitution(await requireAuth(), rawId), unit);
  return { unitId, units, records: await listRecords(key, unitId, page, search, parsePageSize(size)) };
}, 'institution-records');

/** A student of my institution with the full profile (identities, semesters, advisers, trend). */
export const getInstitutionStudentProfile = query(async (rawId: string, studentId: string) => {
  'use server';
  const id = resolveMyInstitution(await requireAuth(), rawId);
  const s = await loadInstitutionStudent(id, studentId);
  return loadStudentProfile(s.individual_id, { studentId: s.id });
}, 'institution-student-profile');

export const getInstitutionSummary = query(async (rawId: string) => {
  'use server';
  return loadInstitutionSummary(resolveMyInstitution(await requireAuth(), rawId));
}, 'institution-summary');

export const getInstitutionAnalytics = query(async (rawId: string) => {
  'use server';
  const auth = await requireAuth();
  return loadInstitutionAnalytics(resolveMyInstitution(auth, rawId), auth.activeRoleId ?? '');
}, 'institution-analytics');

/** The inline detail of one study program ('' = the first one). */
export const getInstitutionProgram = query(async (rawId: string, unitId: string) => {
  'use server';
  const auth = await requireAuth();
  return loadInstitutionProgram(resolveMyInstitution(auth, rawId), auth.activeRoleId ?? '', unitId);
}, 'institution-program');

export const getInstitutionEmployees = query(async (rawId: string, page: number, search: string, size: number) => {
  'use server';
  return loadInstitutionEmployees(resolveMyInstitution(await requireAuth(), rawId), page, search, parsePageSize(size));
}, 'institution-employees');

export const getInstitutionCandidates = query(async (rawId: string, page: number, search: string, size: number) => {
  'use server';
  return loadInstitutionCandidates(resolveMyInstitution(await requireAuth(), rawId), page, search, parsePageSize(size));
}, 'institution-candidates');

export const getFeederPage = query(async (rawId: string, group: 'master' | 'referensi', slug: string, page: number, size: number) => {
  'use server';
  resolveMyInstitution(await requireAuth(), rawId);
  return loadFeederPage(group === 'referensi' ? 'referensi' : 'master', slug, page, parsePageSize(size));
}, 'institution-feeder');
