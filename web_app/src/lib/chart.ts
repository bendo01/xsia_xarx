// Geometry for the inline SVG line charts. Pure, so it can be tested without a DOM.

export interface Point {
  x: number;
  y: number;
}

/** x for category i of n, spread across [left, right]; a single point sits in the middle. */
export function xAt(i: number, n: number, left: number, right: number): number {
  return n <= 1 ? (left + right) / 2 : left + (i * (right - left)) / (n - 1);
}

/** y for a value, mapped so `min` is at `bottom` and `max` at `top` (SVG y grows downward). */
export function yAt(v: number, min: number, max: number, top: number, bottom: number): number {
  if (max === min) return bottom;
  const t = Math.min(1, Math.max(0, (v - min) / (max - min)));
  return bottom - t * (bottom - top);
}

export const linePath = (pts: Point[]): string =>
  pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${round(p.x)} ${round(p.y)}`).join(' ');

/** Closed area under a line, down to `baseY`. */
export function areaPath(pts: Point[], baseY: number): string {
  if (pts.length === 0) return '';
  const first = pts[0];
  const last = pts[pts.length - 1];
  return `${linePath(pts)} L${round(last.x)} ${round(baseY)} L${round(first.x)} ${round(baseY)} Z`;
}

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A readable axis maximum and step for data up to `max` (1/2/5 x 10^n steps,
 * about `targetTicks` of them), e.g. 37 credits -> max 40, step 10.
 */
export function niceScale(max: number, targetTicks = 4): { max: number; step: number } {
  if (!(max > 0)) return { max: 1, step: 1 };
  const rough = max / targetTicks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  return { max: Math.ceil(max / step) * step, step };
}

export function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = min; v <= max + step / 1000; v += step) out.push(round(v));
  return out;
}

/** Which category labels to draw so they do not collide: every k-th, always including the last. */
export function labelIndexes(n: number, maxLabels = 8): number[] {
  if (n <= maxLabels) return Array.from({ length: n }, (_, i) => i);
  const k = Math.ceil(n / maxLabels);
  const idx = Array.from({ length: n }, (_, i) => i).filter((i) => i % k === 0);
  if (idx[idx.length - 1] !== n - 1) {
    // Keep the newest label, and keep every label at least k apart: a neighbour that would
    // sit closer than that is dropped in its favour (otherwise the two overlap).
    if (n - 1 - idx[idx.length - 1] < k) idx.pop();
    idx.push(n - 1);
  }
  return idx;
}
