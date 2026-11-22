// Pure helpers of the administrator's Feeder (PDDikti) pages: which tables exist, how a URL maps
// to a view, and how a table's editable fields are inferred from its own rows (the tables mirror
// an external system, so their shapes are not declared here).
import { FEEDER_SLUGS, REFERENSI_SLUGS } from './feeder';

export type FeederGroup = 'master' | 'referensi' | 'akumulasi' | 'akun' | 'rekapitulasi';

export const FEEDER_GROUPS: Record<FeederGroup, string[]> = {
  master: FEEDER_SLUGS,
  referensi: REFERENSI_SLUGS,
  akumulasi: ['estimasi', 'jumlah-data'],
  akun: ['kredential'],
  rekapitulasi: ['indeks-prestasi-sementara-mahasiswa', 'jumlah-dosen', 'jumlah-mahasiswa', 'kartu-hasil-studi-mahasiswa', 'kartu-rencana-studi-mahasiswa', 'laporan'],
};

/** Only the reference tables accept writes (the API exposes POST/PUT/DELETE for them alone). */
export const FEEDER_WRITABLE: readonly FeederGroup[] = ['referensi'];

export const isFeederGroup = (g: string): g is FeederGroup => Object.prototype.hasOwnProperty.call(FEEDER_GROUPS, g);
export const feederApiPath = (group: FeederGroup, slug: string) => `feeder/${group}/${slug}`;
export const feederUrl = (group: FeederGroup, slug: string, ...rest: string[]) => `/administrator/feeder/${[group, slug, ...rest].join('/')}`;

export type FeederView =
  | { kind: 'index' }
  | { kind: 'list'; group: FeederGroup; slug: string }
  | { kind: 'create'; group: FeederGroup; slug: string }
  | { kind: 'show'; group: FeederGroup; slug: string; id: string }
  | { kind: 'edit'; group: FeederGroup; slug: string; id: string };

/** Map the URL under /administrator/feeder to a view; unknown groups, slugs or shapes give null. */
export function matchFeederPath(path: string): FeederView | null {
  const [group, slug, a, b, ...more] = path.split('/').filter(Boolean);
  if (!group) return { kind: 'index' };
  if (!isFeederGroup(group) || !slug || !FEEDER_GROUPS[group].includes(slug) || more.length) return null;
  const writable = FEEDER_WRITABLE.includes(group);
  if (!a) return { kind: 'list', group, slug };
  if (!b) return a === 'create' ? (writable ? { kind: 'create', group, slug } : null) : { kind: 'show', group, slug, id: a };
  return b === 'edit' && writable ? { kind: 'edit', group, slug, id: a } : null;
}

type Rec = Record<string, unknown>;
export type FeederFieldType = 'number' | 'boolean' | 'text';
export interface FeederField {
  name: string;
  type: FeederFieldType;
}

const BOOKKEEPING = new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'sync_at', 'created_by', 'updated_by']);

/** Editable fields of a table, from the type of each scalar value of a sample row. */
export function inferFeederFields(sample: Rec | undefined | null): FeederField[] {
  if (!sample) return [];
  return Object.entries(sample)
    .filter(([k, v]) => !BOOKKEEPING.has(k) && (v === null || typeof v !== 'object'))
    .map(([name, v]) => ({ name, type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'text' }));
}

export type FeederParse = { ok: true; body: Rec } | { ok: false; errors: Record<string, 'invalid' | 'tooLong'> };

/** Coerce the form's strings to the types of `fields`; blank becomes null, unknown inputs are dropped. */
export function parseFeederForm(fields: FeederField[], input: Rec): FeederParse {
  const body: Rec = {};
  const errors: Record<string, 'invalid' | 'tooLong'> = {};
  for (const f of fields) {
    const raw = input[f.name];
    const v = typeof raw === 'string' ? raw.trim() : raw;
    if (f.type === 'boolean') body[f.name] = v === true || v === 'true' || v === 'on';
    else if (v === undefined || v === null || v === '') body[f.name] = null;
    else if (f.type === 'number') {
      const n = Number(String(v).replace(',', '.'));
      if (Number.isFinite(n)) body[f.name] = n;
      else errors[f.name] = 'invalid';
    } else if (String(v).length > 1000) errors[f.name] = 'tooLong';
    else body[f.name] = String(v);
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, body };
}

const EXPORT_SKIP = new Set(['deleted_at', 'created_by', 'updated_by']);

/** Columns of a CSV export of a feeder table: every scalar field of the rows, in order of first appearance, `id` first. */
export function feederExportColumns(rows: Rec[]): string[] {
  const seen = new Set<string>(rows.some((r) => 'id' in r) ? ['id'] : []);
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) if (!EXPORT_SKIP.has(k) && (v === null || typeof v !== 'object')) seen.add(k);
  }
  return [...seen];
}
