// Changes to staff appointments and employees by the rectorat. Only Rektor / Kepala Biro
// Administrasi Umum (see lib/rectorat-rights.ts); every record is pinned to the caller's own
// institution (a unit or employee of another institution is "not found"). A staff appointment
// creates / revokes a login role on the API side, which is why the right is narrow.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { loadInstitutionUnitOptions, resolveMyInstitution } from './institution';
import { canManageInstitution } from '../lib/rectorat-rights';
import { parseInstitutionWrite } from '../lib/institution-schema';
import type { FieldError } from '../lib/crud-schema';
import { asList } from '../lib/student-select';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));

export type WriteResult = { ok: true; id: string } | { ok: false; errors: Record<string, FieldError> };
export interface Option { id: string; name: string }

/** The caller's institution, provided they may write. */
export function requireInstitutionAdmin(auth: AuthState, rawId = ''): string {
  const institutionId = resolveMyInstitution(auth, rawId);
  if (!canManageInstitution(auth.activeRoleItem)) throw fail('Forbidden', 403);
  return institutionId;
}

const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;

async function ownStaff(institutionId: string, id: string): Promise<Raw> {
  if (!isUuid(id)) throw fail('Not found', 404);
  const st = body(await apiFetch<Raw>(`institution/master/staffes/${enc(id)}`).catch(() => null));
  const units = await loadInstitutionUnitOptions(institutionId);
  if (!st?.id || !units.some((u) => u.id === st.unit_id)) throw fail('Not found', 404);
  return st;
}

async function ownEmployee(institutionId: string, id: string): Promise<Raw> {
  if (!isUuid(id)) throw fail('Not found', 404);
  const e = body(await apiFetch<Raw>(`institution/master/employees/${enc(id)}`).catch(() => null));
  if (!e?.id || e.institution_id !== institutionId) throw fail('Not found', 404);
  return e;
}

export async function saveInstitutionStaff(auth: AuthState, rawId: string, id: string | null, input: Raw): Promise<WriteResult> {
  const institutionId = requireInstitutionAdmin(auth, rawId);
  const parsed = parseInstitutionWrite('staff', input);
  if (!parsed.ok) return parsed;
  const b: Raw = { ...parsed.body };
  const units = await loadInstitutionUnitOptions(institutionId);
  if (!units.some((u) => u.id === b.unit_id)) return { ok: false, errors: { unit_id: 'invalid' } };
  if (!(await ownEmployeeOk(institutionId, String(b.employee_id)))) return { ok: false, errors: { employee_id: 'invalid' } };

  if (id) {
    await ownStaff(institutionId, id);
    await apiFetch(`institution/master/staffes/${enc(id)}`, { method: 'PUT', body: b });
    return { ok: true, id };
  }
  const created = await apiFetch<Raw>('institution/master/staffes', { method: 'POST', body: b });
  return { ok: true, id: String(body(created)?.id ?? '') };
}

async function ownEmployeeOk(institutionId: string, id: string): Promise<boolean> {
  try {
    await ownEmployee(institutionId, id);
    return true;
  } catch {
    return false;
  }
}

export async function removeInstitutionStaff(auth: AuthState, rawId: string, id: string): Promise<void> {
  const institutionId = requireInstitutionAdmin(auth, rawId);
  await ownStaff(institutionId, id);
  await apiFetch(`institution/master/staffes/${enc(id)}`, { method: 'DELETE' });
}

export async function saveInstitutionEmployee(auth: AuthState, rawId: string, id: string | null, input: Raw): Promise<WriteResult> {
  const institutionId = requireInstitutionAdmin(auth, rawId);
  const parsed = parseInstitutionWrite('employee', input);
  if (!parsed.ok) return parsed;
  const b: Raw = { ...parsed.body, institution_id: institutionId, is_active: parsed.body.is_active === true };
  const person = body(await apiFetch<Raw>(`person/master/individual/${enc(String(b.individual_id))}`).catch(() => null));
  if (!person?.id) return { ok: false, errors: { individual_id: 'invalid' } };

  if (id) {
    await ownEmployee(institutionId, id);
    await apiFetch(`institution/master/employees/${enc(id)}`, { method: 'PUT', body: b });
    return { ok: true, id };
  }
  const created = await apiFetch<Raw>('institution/master/employees', { method: 'POST', body: b });
  return { ok: true, id: String(body(created)?.id ?? '') };
}

export async function removeInstitutionEmployee(auth: AuthState, rawId: string, id: string): Promise<void> {
  const institutionId = requireInstitutionAdmin(auth, rawId);
  await ownEmployee(institutionId, id);
  await apiFetch(`institution/master/employees/${enc(id)}`, { method: 'DELETE' });
}

/** What the staff form needs: the record (edit), the institution's units, positions and a name-searched employee list. */
export async function loadStaffForm(institutionId: string, id: string, search: string) {
  const [record, units, positions, employees] = await Promise.all([
    id ? ownStaff(institutionId, id) : Promise.resolve(null),
    loadInstitutionUnitOptions(institutionId),
    apiFetch<unknown>('institution/reference/position-type', { query: { page: 1, page_size: 100 } }).catch(() => []),
    search.trim()
      ? apiPaginated<Raw>('institution/master/employees', { page: 1, per_page: 30, search: search.trim() }).then((r) => r.data.filter((e) => e.institution_id === institutionId)).catch(() => [])
      : Promise.resolve([] as Raw[]),
  ]);
  const options: Record<string, Option[]> = {
    unit_id: units,
    position_type_id: asList<Raw>(positions).map((p) => ({ id: String(p.id), name: String(p.name ?? p.code ?? p.id) })),
    employee_id: employees.map((e) => ({ id: String(e.id), name: [e.code, e.name].filter(Boolean).join(' · ') })),
  };
  if (record?.employee_id && !options.employee_id.some((o) => o.id === record.employee_id)) {
    options.employee_id.unshift({ id: String(record.employee_id), name: String(record.name ?? record.employee_id) });
  }
  return { record, options };
}

/** What the employee form needs: the record (edit) and a name-searched person list. */
export async function loadEmployeeForm(institutionId: string, id: string, search: string) {
  const [record, people] = await Promise.all([
    id ? ownEmployee(institutionId, id) : Promise.resolve(null),
    search.trim()
      ? apiPaginated<Raw>('person/master/individual', { page: 1, per_page: 30, search: search.trim() }).then((r) => r.data).catch(() => [])
      : Promise.resolve([] as Raw[]),
  ]);
  const options: Record<string, Option[]> = {
    individual_id: people.map((p) => ({ id: String(p.id), name: String(p.name ?? p.id) })),
  };
  if (record?.individual_id && !options.individual_id.some((o) => o.id === record.individual_id)) {
    options.individual_id.unshift({ id: String(record.individual_id), name: String(record.name ?? record.individual_id) });
  }
  return { record, options };
}
