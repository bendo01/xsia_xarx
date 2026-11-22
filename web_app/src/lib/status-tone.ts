// The colour family of a student status, by its name (pure, unit-tested). Names come from the API
// (Aktif, Lulus, Cuti, Keluar, Putus Studi, Non-Aktif, Kampus Merdeka...), so matching is by keyword.
export type StatusTone = 'green' | 'blue' | 'amber' | 'red' | 'violet' | 'slate';

export function statusTone(name: string | null | undefined): StatusTone {
  const n = (name ?? '').toLowerCase().trim();
  if (!n || n === '-') return 'slate';
  // "non-aktif" / "tidak aktif" must not be read as "aktif".
  if (/non[\s-]*aktif|tidak\s+aktif|inactive|tidak\s+diketahui|unknown/.test(n)) return 'slate';
  if (/aktif|active/.test(n)) return 'green';
  if (/lulus|graduat|alumni/.test(n)) return 'blue';
  if (/cuti|leave|sedang\s+double|menunggu|pending/.test(n)) return 'amber';
  if (/keluar|putus|drop|mengundurkan|resign|meninggal|dikeluarkan|hilang|wafat/.test(n)) return 'red';
  if (/kampus\s+merdeka|mbkm|double\s+degree|pertukaran|exchange/.test(n)) return 'violet';
  return 'slate';
}

/** Tailwind classes per tone: a tinted background with readable text in light and dark mode. */
export const TONE_CLASS: Record<StatusTone, string> = {
  green: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  blue: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
  red: 'bg-red-500/15 text-red-700 dark:text-red-300',
  violet: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  slate: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
};
