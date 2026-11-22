// The candidate's own admission checklist (programme choice, family card, parents, documents).
// The API acts only on the caller's own candidate; this layer also pins every call to the
// candidate id of the ACTIVE role, so a URL cannot point at somebody else's record.
import { markSafeError } from '@solidjs/web';
import { env } from 'virtual:solid-env/server';

import { apiFetch } from './api';
import type { AuthState } from './auth';
import { parentTypes, type AdmissionStatus, type MemberInput, type OptionItem } from '../lib/admission-types';
import { isUuid } from '../lib/validation';

const BASE = 'academic/candidate/admission';
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));

/** The candidate id the caller may act on; anything else is "not found" (no probing). */
export function ownCandidateId(auth: AuthState, raw: string): string {
  const role = auth.activeRoleItem;
  if (auth.activeRole !== 'candidate' || !role?.roleable_id) throw fail('Forbidden', 403);
  if (!isUuid(raw) || role.roleable_id !== raw) throw fail('Not found', 404);
  return raw;
}

export const loadAdmissionStatus = (id: string) => apiFetch<AdmissionStatus>(`${BASE}/${id}/status`);

export const saveAdmissionUnit = (id: string, unit_id: string, registration_category_id: string) => {
  if (!isUuid(unit_id) || !isUuid(registration_category_id)) throw fail('Invalid choice', 400);
  return apiFetch<AdmissionStatus>(`${BASE}/${id}/unit`, { method: 'PUT', body: { unit_id, registration_category_id } });
};

export const saveAdmissionFamilyCard = (id: string, code: string) =>
  apiFetch<AdmissionStatus>(`${BASE}/${id}/family-card`, { method: 'PUT', body: { code: code.trim() } });

export const addAdmissionMember = (id: string, m: MemberInput) =>
  apiFetch<AdmissionStatus>(`${BASE}/${id}/family-members`, {
    method: 'POST',
    body: {
      relative_type_id: m.relative_type_id,
      name: m.name.trim(),
      nik: m.nik.trim(),
      birth_place: m.birth_place.trim(),
      birth_date: m.birth_date,
      gender_id: m.gender_id || null,
      is_deceased: m.is_deceased,
    },
  });

export const removeAdmissionMember = (id: string, memberId: string) => {
  if (!isUuid(memberId)) throw fail('Not found', 404);
  return apiFetch<AdmissionStatus>(`${BASE}/${id}/family-members/${memberId}`, { method: 'DELETE' });
};

/** Study programmes / classes (public list), parent relative types and genders. */
export async function loadAdmissionLookups() {
  const options = (path: string) =>
    apiFetch<OptionItem[]>(`${path}/options`, { method: 'POST', auth: false, body: {} })
      .then((rows) => (Array.isArray(rows) ? rows.map((r) => ({ id: r.id, name: r.name })) : []))
      .catch(() => [] as OptionItem[]);
  const code = env.VITE_INSTITUTION_CODE.replace(/^["']|["']$/g, '').trim();
  const [units, relatives, genders] = await Promise.all([
    apiFetch<{ units: OptionItem[]; registration_categories: OptionItem[] }>(`${BASE}/units`, { auth: false, query: { institution_code: code } })
      .catch(() => ({ units: [], registration_categories: [] })),
    options('person/reference/relative-type'),
    options('person/reference/gender'),
  ]);
  return {
    units: units.units.map((u) => ({ id: u.id, name: u.name })),
    categories: units.registration_categories.map((c) => ({ id: c.id, name: c.name })),
    relativeTypes: parentTypes(relatives),
    genders,
  };
}

/** Upload (multipart passthrough) of one document type. */
export const uploadAdmissionArchive = (id: string, archiveTypeId: string, form: FormData) => {
  if (!isUuid(archiveTypeId)) throw fail('Not found', 404);
  return apiFetch<AdmissionStatus>(`${BASE}/${id}/archives/${archiveTypeId}`, { method: 'POST', body: form });
};

export const archiveFilePath = (id: string, archiveId: string) => `${BASE}/${id}/archives/file/${archiveId}`;
