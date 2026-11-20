import { describe, expect, it } from 'vitest';

import { classStats, clampMark, finalMark, gradeForMark, marksForGrade, totalWeight, weightsValid, type Evaluation, type GradeScale } from './grading';

const ev = (id: string, weight: number): Evaluation => ({ id, name: id, weight, thread: 1 });
const scale: GradeScale[] = [
  { id: 'A', name: 'A', grade: 4, minimum: 80, maximum: 100 },
  { id: 'B', name: 'B', grade: 3, minimum: 65, maximum: 79.99 },
  { id: 'C', name: 'C', grade: 2, minimum: 50, maximum: 64.99 },
];

describe('grading', () => {
  it('computes the weighted final mark and clamps marks to 0-100', () => {
    const evs = [ev('t', 40), ev('u', 60)];
    expect(finalMark({ t: 100, u: 50 }, evs)).toBe(70);
    expect(finalMark({ t: 500, u: -5 }, evs)).toBe(40);
    expect(finalMark({}, evs)).toBe(0);
  });
  it('finds the grade, clamping outside the scale', () => {
    expect(gradeForMark(85, scale)?.id).toBe('A');
    expect(gradeForMark(65, scale)?.id).toBe('B');
    expect(gradeForMark(10, scale)?.id).toBe('C');
    expect(gradeForMark(79.995, scale)?.id).toBe('B'); // in a gap: the highest row whose minimum it reaches
    expect(gradeForMark(50, [])).toBeNull();
  });
  it('validates that weights sum to 100', () => {
    expect(weightsValid([ev('a', 60), ev('b', 40)])).toBe(true);
    expect(weightsValid([ev('a', 60), ev('b', 30)])).toBe(false);
    expect(totalWeight([])).toBe(0);
  });
  it('back-fills marks so the total lands inside the grade range', () => {
    const evs = [ev('a', 50), ev('b', 50)];
    const marks = marksForGrade(scale[0], evs);
    expect(marks).toEqual({ a: 90, b: 90 });
    expect(gradeForMark(finalMark(marks, evs), scale)?.id).toBe('A');
    expect(marksForGrade(scale[0], [])).toEqual({});
  });
  it('summarises a class', () => {
    expect(classStats([])).toEqual({ avg: 0, highest: 0, lowest: 0, graded: 0 });
    expect(classStats([80, 0, 60])).toEqual({ avg: 46.7, highest: 80, lowest: 0, graded: 2 });
    expect(clampMark('abc')).toBe(0);
  });
});
