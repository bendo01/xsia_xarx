import { describe, expect, it } from 'vitest';
import { MAX_SKS, enrollBlocker, gradeTone, semesterIps, totalCredits } from './enrollment-rules';

const offer = (o: Partial<{ id: string; course_id: string; credits: number; enrolled_count: number; max_member: number }> = {}) => ({
  id: 't1', course_id: 'c1', credits: 3, enrolled_count: 0, max_member: 40, ...o,
});
const taken = (teach_id: string | null, course_id: string, credit = 3) => ({ teach_id, course_id, credit });

describe('enrollBlocker', () => {
  it('allows a normal enrollment', () => {
    expect(enrollBlocker({ locked: false, enrolled: [], offering: offer() })).toBeNull();
  });
  it('rejects classes that are not on offer', () => {
    expect(enrollBlocker({ locked: false, enrolled: [], offering: undefined })).toBe('NOT_OFFERED');
  });
  it('rejects a locked semester', () => {
    expect(enrollBlocker({ locked: true, enrolled: [], offering: offer() })).toBe('LOCKED');
  });
  it('distinguishes the same class from the same course in another class', () => {
    expect(enrollBlocker({ locked: false, enrolled: [taken('t1', 'c1')], offering: offer() })).toBe('ALREADY_ENROLLED');
    expect(enrollBlocker({ locked: false, enrolled: [taken('t9', 'c1')], offering: offer() })).toBe('DUPLICATE_COURSE');
  });
  it('rejects a full class', () => {
    expect(enrollBlocker({ locked: false, enrolled: [], offering: offer({ enrolled_count: 40 }) })).toBe('FULL');
    expect(enrollBlocker({ locked: false, enrolled: [], offering: offer({ enrolled_count: 39 }) })).toBeNull();
  });
  it('enforces the credit cap exactly at the boundary', () => {
    const enrolled = [taken('a', 'x', 21)];
    expect(enrollBlocker({ locked: false, enrolled, offering: offer({ credits: 3 }) })).toBeNull(); // 24 = cap
    expect(enrollBlocker({ locked: false, enrolled, offering: offer({ credits: 4 }) })).toBe('CREDIT_LIMIT'); // 25
    expect(MAX_SKS).toBe(24);
  });
  it('checks in a stable order (lock beats everything but availability)', () => {
    const o = offer({ enrolled_count: 40 });
    expect(enrollBlocker({ locked: true, enrolled: [taken('t1', 'c1')], offering: o })).toBe('LOCKED');
  });
});

describe('semesterIps', () => {
  const courses = [{ credit: 3, grade_point: 4 }, { credit: 2, grade_point: 3 }];
  it('prefers the API value, even 0', () => {
    expect(semesterIps(3.5, courses)).toBe(3.5);
    expect(semesterIps(0, courses)).toBe(0);
  });
  it('falls back to the credit-weighted average', () => {
    expect(semesterIps(null, courses)).toBeCloseTo((3 * 4 + 2 * 3) / 5);
    expect(semesterIps(undefined, [])).toBe(0);
  });
});

describe('helpers', () => {
  it('totalCredits ignores missing credit', () => {
    expect(totalCredits([{ credit: 3 }, { credit: undefined as unknown as number }])).toBe(3);
  });
  it.each([['A', 'a'], ['b+', 'b'], ['C', 'c'], ['D', 'd'], ['E', 'e'], ['T', 'e'], ['-', 'none'], ['', 'none'], [undefined, 'none']])(
    'gradeTone(%s) = %s',
    (g, tone) => expect(gradeTone(g as string | undefined)).toBe(tone),
  );
});
