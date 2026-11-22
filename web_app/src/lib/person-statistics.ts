// Pure helpers for the administrator dashboard's person demographics.
export interface StatItem {
  name: string;
  value: number;
}

export interface Distribution {
  key: string;
  label: string;
  items: StatItem[];
}

export interface PersonStatistics {
  total: number;
  deceased: number;
  specialNeed: number;
  socialProtectionCardRecipient: number;
  distributions: Distribution[];
  ageGroups: StatItem[];
}

type Raw = Record<string, any>;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);
const items = (v: unknown): StatItem[] =>
  (Array.isArray(v) ? v : [])
    .filter((i): i is Raw => i !== null && typeof i === 'object')
    .map((i) => ({ name: String(i.name ?? ''), value: num(i.count) }))
    .filter((i) => i.name !== '');

/** Shape the API's statistics (`count` per item) for the charts; missing or malformed parts become empty. */
export function normaliseStatistics(raw: Raw | null | undefined): PersonStatistics {
  return {
    total: num(raw?.total),
    deceased: num(raw?.deceased),
    specialNeed: num(raw?.special_need),
    socialProtectionCardRecipient: num(raw?.social_protection_card_recipient),
    distributions: (Array.isArray(raw?.distributions) ? raw!.distributions : [])
      .filter((d: unknown): d is Raw => d !== null && typeof d === 'object' && typeof (d as Raw).key === 'string')
      .map((d: Raw) => ({ key: d.key, label: String(d.label ?? d.key), items: items(d.items) })),
    ageGroups: items(raw?.age_groups),
  };
}

/** A share of the total as a percentage with one decimal ("12.5"); "-" when there is no total. */
export function sharePercent(part: number, total: number): string {
  return total > 0 ? (Math.round((part / total) * 1000) / 10).toFixed(1) : '-';
}

const BAR_KEYS = new Set(['education', 'occupation', 'profession', 'income']);
const MAX_DONUT_SLICES = 6;

/** Few categories read well as a donut; long ones (and the known long lists) as bars. */
export function chartVariant(key: string, itemCount: number): 'donut' | 'bar' {
  if (key === 'gender') return 'donut';
  return BAR_KEYS.has(key) || itemCount > MAX_DONUT_SLICES ? 'bar' : 'donut';
}
