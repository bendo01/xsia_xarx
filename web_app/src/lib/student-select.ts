import type { FamilyCardItem, FamilyMemberItem, ResidenceItem, StudentItem } from './student-types';
import { isUuid } from './validation';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

/**
 * The route param can be a literal placeholder ("[id]", ":id") or the zero UUID
 * when a link was built before the user's individual id was known. Those mean
 * "me". Anything else must be a real UUID: the value ends up in an API path.
 */
export function resolveIndividualId(
  raw: string | null | undefined,
  mine: string | null | undefined,
): string | null {
  const v = (raw ?? '').trim();
  const placeholder = !v || v === '[id]' || v === ':id' || v === ZERO_UUID;
  const id = placeholder ? (mine ?? '') : v;
  return isUuid(id) && id !== ZERO_UUID ? id : null;
}

/**
 * Which student identity to show for an individual who may hold several:
 * an explicit choice (id or code), else the one behind the active role, else the first.
 */
export function pickStudent(
  students: StudentItem[],
  choice: { studentId?: string | null; code?: string | null; preferredId?: string | null },
): StudentItem | null {
  if (students.length === 0) return null;
  return (
    (choice.studentId && students.find((s) => s.id === choice.studentId)) ||
    (choice.code && students.find((s) => s.code === choice.code)) ||
    (choice.preferredId && students.find((s) => s.id === choice.preferredId)) ||
    students[0]
  );
}

/** Display name with academic titles: "Dr. Budi Santoso, M.Kom". */
export function fullName(i: { name: string; front_title?: string | null; last_title?: string | null }): string {
  const front = i.front_title?.trim();
  const last = i.last_title?.trim();
  return [front, i.name, last ? `, ${last}` : ''].filter(Boolean).join(' ').replace(' ,', ',');
}

type Raw = Record<string, any>;
const nameOf = (v: unknown): string | null =>
  v && typeof v === 'object' && typeof (v as Raw).name === 'string' ? ((v as Raw).name as string) : null;
const asList = <T>(v: unknown): T[] =>
  Array.isArray(v) ? (v as T[]) : Array.isArray((v as Raw | null)?.data) ? ((v as Raw).data as T[]) : [];

/** The person endpoint's body -> the parts of the profile that do not need other calls. */
export function shapeIndividual(raw: Raw) {
  const individual = (raw.individual ?? raw) as Raw;
  return {
    individual: {
      id: String(individual.id ?? ''),
      code: String(individual.code ?? ''),
      name: String(individual.name ?? ''),
      front_title: (individual.front_title ?? null) as string | null,
      last_title: (individual.last_title ?? null) as string | null,
      birth_date: String(individual.birth_date ?? ''),
      birth_place: String(individual.birth_place ?? ''),
      is_special_need: Boolean(individual.is_special_need),
    },
    refs: {
      gender: nameOf(raw.gender),
      religion: nameOf(raw.religion),
      marital_status: nameOf(raw.marital_status),
      education: nameOf(raw.education),
      occupation: nameOf(raw.occupation),
    },
    phones: asList<{ id: string; value: string; type_name?: string | null }>(raw.phones),
    emails: asList<{ id: string; value: string; type_name?: string | null }>(raw.electronic_mails),
    residences: asList<ResidenceItem>(raw.residences),
    familyCards: asList<Raw>(raw.family_cards).map((c) => ({ ...c, members: asList<FamilyMemberItem>(c.members) }) as FamilyCardItem),
    students: asList<StudentItem>(raw.students),
  };
}

export { asList };

const PARENT_TYPE = /ayah|ibu|bapak|wali|orang\s*tua|father|mother|guardian|parent/i;

export interface ParentRow {
  id: string;
  name: string;
  relation: string;
  familyCard: string;
}

/**
 * The parents / guardians recorded on the person's family cards: members whose relationship is a
 * parent or guardian type. A row relates `individual` to `relative`; the parent is the one who is
 * not the person themselves (when neither is, the member is listed as is).
 */
export function parentsOf(cards: FamilyCardItem[], individualId: string): ParentRow[] {
  const rows: ParentRow[] = [];
  const seen = new Set<string>();
  for (const c of cards) {
    for (const m of c.members) {
      if (!PARENT_TYPE.test(m.relative_type_name ?? '')) continue;
      const self = individualId !== '' && (m.individual_id === individualId || m.relative_id === individualId);
      const name = (self && m.individual_id === individualId ? m.relative_name : m.individual_name) ?? '';
      if (!name || seen.has(m.id)) continue;
      seen.add(m.id);
      rows.push({ id: m.id, name, relation: m.relative_type_name ?? '', familyCard: c.code ?? '' });
    }
  }
  return rows;
}
