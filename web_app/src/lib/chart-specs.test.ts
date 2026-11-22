import { describe, expect, it } from 'vitest';

import { seriesSpec, slicesSpec } from './chart-specs';

describe('chart specs', () => {
  const line = { categories: ['20251', '20252'], series: [{ name: 'A', values: [1, 2] }, { name: 'B', values: [3, 4] }] };
  it('seriesSpec labels periods, keeps every series and stacks on request', () => {
    const s = seriesSpec(line, 'bar', { stacked: true });
    expect(s.labels).toEqual(['2025/1', '2025/2']);
    expect(s.datasets.map((d) => d.label)).toEqual(['A', 'B']);
    expect(s.stacked).toBe(true);
    expect(s.noLegend).toBe(false);
  });
  it('a single line series is filled with no legend', () => {
    const s = seriesSpec({ categories: ['x'], series: [{ name: 'IPK', values: [3] }] }, 'line');
    expect(s.datasets[0].fill).toBe(true);
    expect(s.noLegend).toBe(true);
  });
  it('slicesSpec limits rows and picks the orientation', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ name: `n${i}`, value: 20 - i }));
    const bar = slicesSpec(items, 'bar');
    expect(bar.labels).toHaveLength(12);
    expect(bar.horizontal).toBe(true);
    expect(slicesSpec(items, 'doughnut').labels).toHaveLength(8);
  });
  it('drops all-zero series and can turn zeros into gaps', () => {
    const l = { categories: ['a', 'b'], series: [{ name: 'on', values: [2, 0] }, { name: 'never', values: [0, 0] }] };
    const s = seriesSpec(l, 'line', { gapZeros: true });
    expect(s.datasets.map((d) => d.label)).toEqual(['on']);
    expect(s.datasets[0].data).toEqual([2, null]);
    expect(seriesSpec({ categories: ['a'], series: [{ name: 'z', values: [0] }] }, 'bar').datasets).toHaveLength(1);
  });
});
