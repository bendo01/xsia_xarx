import { describe, expect, it } from 'vitest';
import { areaPath, labelIndexes, linePath, niceScale, ticks, xAt, yAt } from './chart';

describe('scales', () => {
  it('xAt spreads evenly and centres a lone point', () => {
    expect([0, 1, 2].map((i) => xAt(i, 3, 10, 110))).toEqual([10, 60, 110]);
    expect(xAt(0, 1, 10, 110)).toBe(60);
  });
  it('yAt maps min to the bottom and max to the top, clamping outliers', () => {
    expect(yAt(0, 0, 4, 20, 220)).toBe(220);
    expect(yAt(4, 0, 4, 20, 220)).toBe(20);
    expect(yAt(2, 0, 4, 20, 220)).toBe(120);
    expect(yAt(99, 0, 4, 20, 220)).toBe(20);
    expect(yAt(-5, 0, 4, 20, 220)).toBe(220);
    expect(yAt(1, 3, 3, 20, 220)).toBe(220); // degenerate range
  });
});

describe('paths', () => {
  const pts = [{ x: 0, y: 10 }, { x: 5.555, y: 20 }];
  it('linePath', () => expect(linePath(pts)).toBe('M0 10 L5.56 20'));
  it('areaPath closes down to the baseline', () => expect(areaPath(pts, 50)).toBe('M0 10 L5.56 20 L5.56 50 L0 50 Z'));
  it('areaPath of nothing is empty', () => expect(areaPath([], 50)).toBe(''));
});

describe('niceScale / ticks', () => {
  it.each([
    [37, 40, 10],
    [4, 4, 1],
    [140, 150, 50],
    [0, 1, 1],
    [-3, 1, 1],
  ])('niceScale(%s) = max %s step %s', (v, max, step) => expect(niceScale(v)).toEqual({ max, step }));
  it('ticks include both ends', () => {
    expect(ticks(0, 4, 1)).toEqual([0, 1, 2, 3, 4]);
    expect(ticks(0, 0.6, 0.2)).toEqual([0, 0.2, 0.4, 0.6]);
  });
});

describe('labelIndexes', () => {
  it('labels everything when there is room', () => expect(labelIndexes(5, 8)).toEqual([0, 1, 2, 3, 4]));
  it('never puts two labels closer together than the step (they would overlap)', () => {
    expect(labelIndexes(4, 2)).toEqual([0, 3]); // k=2: the last label replaces index 2, not sits beside it
    for (let n = 2; n <= 40; n++) {
      for (const max of [2, 3, 5, 8]) {
        const idx = labelIndexes(n, max);
        if (n <= max) continue;
        const k = Math.ceil(n / max);
        for (let i = 1; i < idx.length; i++) expect(idx[i] - idx[i - 1], `n=${n} max=${max}`).toBeGreaterThanOrEqual(k);
        expect(idx.at(-1)).toBe(n - 1);
      }
    }
  });
  it('thins out long series but keeps the newest label', () => {
    const idx = labelIndexes(20, 8);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(19);
    expect(idx.length).toBeLessThanOrEqual(9);
    expect(new Set(idx).size).toBe(idx.length);
  });
});

import { arcPath, barRows, pieSlices } from './chart';

describe('pie geometry', () => {
  it('splits the circle by value, skipping empty values', () => {
    const s = pieSlices([1, 0, 3]);
    expect(s.map((x) => x.index)).toEqual([0, 2]);
    expect(s[0].fraction).toBeCloseTo(0.25);
    expect(s[0].start).toBe(0);
    expect(s[1].start).toBeCloseTo(s[0].end);
    expect(s[1].end).toBeCloseTo(Math.PI * 2);
    expect(pieSlices([0, -2])).toEqual([]);
  });
  it('draws a single slice as a closed ring (two arcs)', () => {
    const [only] = pieSlices([5]);
    const d = arcPath(50, 50, 20, 40, only.start, only.end);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(arcPath(50, 50, 0, 40, 0, Math.PI / 2)).toMatch(/^M50 50 L50 10 A40 40 0 0 1 90 50 Z$/);
  });
  it('flags large arcs', () => {
    expect(arcPath(50, 50, 20, 40, 0, Math.PI * 1.5)).toContain(' 0 1 1 ');
  });
});

describe('bar rows', () => {
  it('scales to the longest and limits the rows', () => {
    expect(barRows([10, 5, 0], 2).map((r) => r.fraction)).toEqual([1, 0.5]);
    expect(barRows([1000, 1])[1].fraction).toBeGreaterThan(0); // never invisible
    expect(barRows([0, 0]).map((r) => r.fraction)).toEqual([0, 0]);
  });
});
