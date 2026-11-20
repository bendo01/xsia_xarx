// Aggregates what the lecturer pages need. The lecturer "show" endpoint eagerly loads
// homebases, ranks, groups and assigned classes, so one call replaces the old client's
// five sequential browser requests; the token never leaves the server.
import { apiFetch } from './api';
import { asList, shapeIndividual } from '../lib/student-select';
import type { AssignedTeach, LecturerRecord } from '../lib/lecturer-types';

const enc = encodeURIComponent;
const ZERO = '00000000-0000-0000-0000-000000000000';
type Raw = Record<string, any>;

const newestFirst = <T extends Raw>(list: T[], ...keys: string[]) =>
  list.slice().sort((a, b) => {
    const ts = (x: T) => new Date(keys.map((k) => x[k]).find(Boolean) || 0).getTime();
    return ts(b) - ts(a);
  });

export function shapeLecturer(raw: Raw): LecturerRecord {
  return {
    id: String(raw.id ?? ''),
    code: String(raw.code ?? ''),
    nidn: raw.nidn ?? null,
    nuptk: raw.nuptk ?? null,
    name: raw.name ?? null,
    individual_id: String(raw.individual_id ?? ''),
    front_title: raw.front_title ?? null,
    last_title: raw.last_title ?? null,
    unit_name: raw.unit_name ?? null,
    rank_name: raw.rank_name ?? raw.rank?.name ?? null,
    group_name: raw.group_name ?? raw.group?.name ?? null,
    status_name: raw.status_name ?? raw.status?.name ?? null,
    contract_name: raw.contract_name ?? raw.contract?.name ?? null,
    start_date: raw.start_date ?? null,
    end_date: raw.end_date ?? null,
    homebases: newestFirst(asList<Raw>(raw.homebases), 'updated_at', 'created_at') as any,
    academic_ranks: newestFirst(asList<Raw>(raw.academic_ranks), 'start_date', 'decree_date', 'created_at') as any,
    academic_groups: newestFirst(asList<Raw>(raw.academic_groups), 'start_date', 'decree_date', 'created_at') as any,
    assigned_teaches: asList<AssignedTeach>(raw.assigned_teaches),
  };
}

export async function loadLecturerRecord(lecturerId: string): Promise<LecturerRecord> {
  const raw = await apiFetch<Raw>(`academic/lecturer/master/lecturers/${enc(lecturerId)}`);
  const rec = shapeLecturer((raw.data ?? raw) as Raw);
  if (rec.assigned_teaches.length === 0) {
    // Older API builds omit the relation: fall back to the dedicated endpoint.
    rec.assigned_teaches = await loadAssignedTeaches(rec.id);
  }
  rec.assigned_teaches = rec.assigned_teaches.filter((t) => !t.lecturer_id || t.lecturer_id === rec.id);
  return rec;
}

export async function loadAssignedTeaches(lecturerId: string): Promise<AssignedTeach[]> {
  return asList<AssignedTeach>(
    await apiFetch<unknown>(`academic/campaign/transaction/teaches/lecturer/${enc(lecturerId)}`).catch(() => []),
  ).filter((t) => t.lecturer_id === lecturerId);
}

/** The individual's person body plus their lecturer record (null when they have none). */
export async function loadLecturerProfile(individualId: string, preferredLecturerId?: string | null) {
  const raw = await apiFetch<Raw>(`person/master/individual/${enc(individualId)}`);
  const base = shapeIndividual(raw);
  const body = (raw.data ?? raw) as Raw;
  const lecturerId =
    (body.lecturer?.id as string | undefined) ||
    (preferredLecturerId && preferredLecturerId !== ZERO ? preferredLecturerId : undefined);
  const lecturer = lecturerId ? await loadLecturerRecord(lecturerId).catch(() => null) : null;
  return { ...base, lecturer };
}
