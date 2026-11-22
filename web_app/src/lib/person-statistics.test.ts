import { describe, expect, it } from 'vitest';

import { chartVariant, normaliseStatistics, sharePercent } from './person-statistics';

describe('normaliseStatistics', () => {
  it('maps counts to values and keeps the headline numbers', () => {
    const s = normaliseStatistics({
      total: 200, deceased: 5, special_need: 3, social_protection_card_recipient: 40,
      distributions: [{ key: 'gender', label: 'Gender', items: [{ name: 'L', count: 120 }, { name: 'P', count: 80 }] }],
      age_groups: [{ name: '0-17', count: 10 }],
    });
    expect(s).toEqual({
      total: 200, deceased: 5, specialNeed: 3, socialProtectionCardRecipient: 40,
      distributions: [{ key: 'gender', label: 'Gender', items: [{ name: 'L', value: 120 }, { name: 'P', value: 80 }] }],
      ageGroups: [{ name: '0-17', value: 10 }],
    });
  });
  it('turns missing or malformed data into empty values', () => {
    expect(normaliseStatistics(null)).toEqual({ total: 0, deceased: 0, specialNeed: 0, socialProtectionCardRecipient: 0, distributions: [], ageGroups: [] });
    const s = normaliseStatistics({ total: 'x', deceased: -4, distributions: [null, { label: 'no key' }, { key: 'k', items: [{ count: 3 }, { name: 'a', count: 'z' }] }], age_groups: 'nope' });
    expect(s.total).toBe(0);
    expect(s.deceased).toBe(0);
    expect(s.distributions).toEqual([{ key: 'k', label: 'k', items: [{ name: 'a', value: 0 }] }]);
    expect(s.ageGroups).toEqual([]);
  });
});

describe('sharePercent / chartVariant', () => {
  it('rounds to one decimal and survives an empty total', () => {
    expect(sharePercent(1, 3)).toBe('33.3');
    expect(sharePercent(5, 0)).toBe('-');
  });
  it('picks donuts for short lists and bars for long or known-long ones', () => {
    expect(chartVariant('gender', 20)).toBe('donut');
    expect(chartVariant('religion', 5)).toBe('donut');
    expect(chartVariant('religion', 9)).toBe('bar');
    expect(chartVariant('education', 3)).toBe('bar');
  });
});
