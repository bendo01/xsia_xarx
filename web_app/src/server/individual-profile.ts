// Everything the administrator's profile page shows about one individual. Each section is fetched on
// its own and degrades to "nothing" when its endpoint fails or ignores the filter, so one slow or
// missing source never blanks the page. Rows are only kept when they really belong to the individual.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { redact } from './admin-crud';
import { BIODATA_REFERENCES, INDIVIDUAL_LINKS, INDIVIDUAL_REFERENCES, bmi, bmiCategory } from '../lib/individual-profile';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const body = (r: Raw | null) => ((r?.data ?? r) as Raw | null) ?? null;

const labelOf = (o: Raw | null, fallback: string) => (o ? [o.code, o.name].filter((x) => x !== undefined && x !== null && x !== '').join(' · ') || fallback : fallback);

/** field -> display name of the referenced record (the id when it cannot be read). */
async function resolveNames(record: Raw, refs: Record<string, string>): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(refs)
      .filter(([field]) => isUuid(String(record[field] ?? '')))
      .map(async ([field, api]) => {
        const id = String(record[field]);
        const one = await apiFetch<Raw>(`${api}/${enc(id)}`).then(body).catch(() => null);
        return [field, labelOf(one, id)] as const;
      }),
  );
  return Object.fromEntries(entries);
}

/** Rows of `api` filtered by `field = id`, keeping only rows that really carry that id. */
async function owned(api: string, field: string, id: string, size = 20): Promise<Raw[]> {
  try {
    const res = await apiPaginated<Raw>(api, { page: 1, per_page: size, [field]: id });
    return res.data.filter((r) => r[field] === id).map(redact);
  } catch {
    return [];
  }
}

export async function loadIndividualProfile(auth: AuthState, id: string) {
  requireAdministrator(auth);
  if (!isUuid(id)) throw markSafeError(new Error('Not found'));
  const individual = await apiFetch<Raw>(`person/master/individual/${enc(id)}`).then(body).catch(() => null);
  if (!individual?.id) throw markSafeError(new Error('Not found'));

  const [names, biodataRows, users, mails, phones, ...links] = await Promise.all([
    resolveNames(individual, INDIVIDUAL_REFERENCES),
    owned('person/master/biodata', 'individual_id', id, 1),
    owned('user', 'individual_id', id, 5),
    owned('contact/master/electronic-mails', 'electronic_mailable_id', id),
    owned('contact/master/phones', 'phoneable_id', id),
    ...INDIVIDUAL_LINKS.map((l) => owned(l.api, l.filter, id)),
  ]);

  const biodata = biodataRows[0] ?? null;
  const biodataNames = biodata ? await resolveNames(biodata, BIODATA_REFERENCES) : {};
  const index = biodata ? bmi(Number(biodata.height), Number(biodata.weight)) : null;

  return {
    individual: redact(individual),
    names,
    biodata,
    biodataNames,
    bmi: index === null ? null : { value: index, category: bmiCategory(index) },
    users: users.map((u) => ({ id: String(u.id), name: String(u.name ?? ''), email: String(u.email ?? ''), is_active: u.is_active === true, email_verified_at: u.email_verified_at ?? null })),
    mails: mails.map((m) => ({ id: String(m.id), value: String(m.email_address ?? '') })),
    phones: phones.map((p) => ({ id: String(p.id), value: String(p.phone_number ?? '') })),
    linked: INDIVIDUAL_LINKS.map((l, i) => ({
      key: l.key,
      label: l.label,
      page: l.page,
      rows: links[i].map((r) => ({ id: String(r.id), name: String(r.name ?? r.code ?? r.id) })),
    })).filter((l) => l.rows.length > 0),
  };
}

export type IndividualProfile = Awaited<ReturnType<typeof loadIndividualProfile>>;
