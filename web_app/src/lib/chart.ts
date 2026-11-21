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

// ---- Pie / donut ----------------------------------------------------------------------------

export interface PieSlice {
  /** index in the input */
  index: number;
  value: number;
  /** share of the total, 0..1 */
  fraction: number;
  /** start / end angle in radians, clockwise from 12 o'clock */
  start: number;
  end: number;
}

const TAU = Math.PI * 2;

/** Slices for the positive values, in input order. Non-positive values get no slice. */
export function pieSlices(values: number[]): PieSlice[] {
  const total = values.reduce((s, v) => s + (v > 0 ? v : 0), 0);
  if (!(total > 0)) return [];
  let at = 0;
  const out: PieSlice[] = [];
  values.forEach((v, index) => {
    if (!(v > 0)) return;
    const fraction = v / total;
    out.push({ index, value: v, fraction, start: at, end: at + fraction * TAU });
    at += fraction * TAU;
  });
  return out;
}

const pt = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.sin(a), cy - r * Math.cos(a)];

/**
 * SVG path of a ring segment between radii `r0` (inner, 0 for a full pie) and `r1`. A segment that
 * covers (almost) the whole circle is drawn as two halves, because one arc cannot start and end
 * at the same point.
 */
export function arcPath(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): string {
  const span = a1 - a0;
  if (span >= TAU - 1e-6) {
    const mid = a0 + Math.PI;
    return `${arcPath(cx, cy, r0, r1, a0, mid)} ${arcPath(cx, cy, r0, r1, mid, a1)}`;
  }
  const large = span > Math.PI ? 1 : 0;
  const [x0, y0] = pt(cx, cy, r1, a0);
  const [x1, y1] = pt(cx, cy, r1, a1);
  if (r0 <= 0) return `M${round(cx)} ${round(cy)} L${round(x0)} ${round(y0)} A${r1} ${r1} 0 ${large} 1 ${round(x1)} ${round(y1)} Z`;
  const [x2, y2] = pt(cx, cy, r0, a1);
  const [x3, y3] = pt(cx, cy, r0, a0);
  return `M${round(x0)} ${round(y0)} A${r1} ${r1} 0 ${large} 1 ${round(x1)} ${round(y1)} L${round(x2)} ${round(y2)} A${r0} ${r0} 0 ${large} 0 ${round(x3)} ${round(y3)} Z`;
}

// ---- Horizontal bars ------------------------------------------------------------------------

export interface BarRow {
  index: number;
  value: number;
  /** bar length as a fraction of the longest, 0..1 (a tiny positive value still gets a visible sliver) */
  fraction: number;
}

/** Bars for the first `limit` rows, scaled to the longest one shown. */
export function barRows(values: number[], limit = 15): BarRow[] {
  const shown = values.slice(0, limit).map((value, index) => ({ index, value: Math.max(0, value) }));
  const max = Math.max(0, ...shown.map((r) => r.value));
  return shown.map((r) => ({ ...r, fraction: max > 0 ? Math.max(r.value > 0 ? 0.01 : 0, r.value / max) : 0 }));
}
