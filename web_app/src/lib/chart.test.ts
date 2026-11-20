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
  it('thins out long series but keeps the newest label', () => {
    const idx = labelIndexes(20, 8);
    expect(idx[0]).toBe(0);
    expect(idx[idx.length - 1]).toBe(19);
    expect(idx.length).toBeLessThanOrEqual(9);
    expect(new Set(idx).size).toBe(idx.length);
  });
});
