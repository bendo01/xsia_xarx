// Client-facing functions for the rectorat's writes (staff appointments, employees).
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import {
  loadEmployeeForm, loadStaffForm, removeInstitutionEmployee, removeInstitutionStaff, requireInstitutionAdmin,
  saveInstitutionEmployee, saveInstitutionStaff, type WriteResult,
} from '../server/institution-write';
import { canManageInstitution } from './rectorat-rights';

export type { WriteResult };

/** Whether the signed-in rectorat user may change staff and employees (hides the buttons otherwise). */
export const getInstitutionRights = query(async () => {
  'use server';
  return { canManage: canManageInstitution((await requireAuth()).activeRoleItem) };
}, 'institution-rights');

export const getStaffForm = query(async (rawId: string, id: string, search: string) => {
  'use server';
  return loadStaffForm(requireInstitutionAdmin(await requireAuth(), rawId), id, search);
}, 'institution-staff-form');

export const getEmployeeForm = query(async (rawId: string, id: string, search: string) => {
  'use server';
  return loadEmployeeForm(requireInstitutionAdmin(await requireAuth(), rawId), id, search);
}, 'institution-employee-form');

export async function saveStaffRow(rawId: string, id: string, input: Record<string, unknown>): Promise<WriteResult> {
  'use server';
  return saveInstitutionStaff(await requireAuth(), rawId, id || null, input);
}

export async function deleteStaffRow(rawId: string, id: string): Promise<void> {
  'use server';
  await removeInstitutionStaff(await requireAuth(), rawId, id);
}

export async function saveEmployeeRow(rawId: string, id: string, input: Record<string, unknown>): Promise<WriteResult> {
  'use server';
  return saveInstitutionEmployee(await requireAuth(), rawId, id || null, input);
}

export async function deleteEmployeeRow(rawId: string, id: string): Promise<void> {
  'use server';
  await removeInstitutionEmployee(await requireAuth(), rawId, id);
}
