import type { StudentItem } from './student-types';
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
    students: asList<StudentItem>(raw.students),
  };
}

export { asList };
