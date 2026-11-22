import { describe, expect, it } from 'vitest';

import { buildConfig, colorOf, PALETTE, withAlpha, type ChartSpec } from './chartjs';

const base: ChartSpec = { kind: 'line', labels: ['a', 'b'], datasets: [{ label: 'x', data: [1, 2] }, { label: 'y', data: [3, 4], fill: true }] };

describe('chartjs config', () => {
  it('withAlpha converts hex and leaves other colours alone', () => {
    expect(withAlpha('#6366f1', 0.5)).toBe('rgba(99, 102, 241, 0.5)');
    expect(withAlpha('oklch(0.5 0.1 200)', 0.5)).toBe('oklch(0.5 0.1 200)');
  });
  it('cycles the palette and honours explicit colours', () => {
    expect(colorOf(0)).toBe(PALETTE[0]);
    expect(colorOf(PALETTE.length)).toBe(PALETTE[0]);
    expect(colorOf(1, '#000000')).toBe('#000000');
  });
  it('line chart: one dataset per series, fill only when asked, legend only for several series', () => {
    const c = buildConfig(base) as any;
    expect(c.type).toBe('line');
    expect(c.data.datasets.map((d: any) => d.fill)).toEqual([false, true]);
    expect(c.options.plugins.legend.display).toBe(true);
    expect((buildConfig({ ...base, datasets: [base.datasets[0]] }) as any).options.plugins.legend.display).toBe(false);
  });
  it('bar chart: stacked axes and horizontal index axis', () => {
    const c = buildConfig({ ...base, kind: 'bar', stacked: true, horizontal: true }) as any;
    expect(c.options.indexAxis).toBe('y');
    expect(c.options.scales.x.stacked).toBe(true);
    expect(c.options.scales.y.stacked).toBe(true);
  });
  it('mixed chart: line dataset on a secondary axis adds y1', () => {
    const c = buildConfig({ kind: 'bar', labels: ['a'], datasets: [{ label: 'n', data: [5] }, { label: 'gpa', data: [3.2], type: 'line', axis: 'y1' }], format1: (n) => n.toFixed(2) }) as any;
    expect(c.options.scales.y1.position).toBe('right');
    expect(c.data.datasets[1].type).toBe('line');
    expect(c.options.scales.y1.ticks.callback(3.2)).toBe('3.20');
  });
  it('doughnut: one coloured slice per label, legend shown', () => {
    const c = buildConfig({ kind: 'doughnut', labels: ['p', 'q'], datasets: [{ label: 'v', data: [1, 3] }] }) as any;
    expect(c.type).toBe('doughnut');
    expect(c.data.datasets[0].backgroundColor).toHaveLength(2);
    expect(c.options.plugins.legend.display).toBe(true);
  });
  it('formats ticks and tooltips with the given formatter; reduced motion disables animation', () => {
    const c = buildConfig({ ...base, format: (n) => `${n}!` }, undefined, { reduceMotion: true }) as any;
    expect(c.options.scales.y.ticks.callback(3)).toBe('3!');
    expect(c.options.plugins.tooltip.callbacks.label({ dataset: { label: 'x' }, parsed: { x: 0, y: 7 }, label: 'a' })).toBe('x: 7!');
    expect(c.options.animation).toBe(false);
  });
  it('count axes use whole-number ticks unless a precision is given', () => {
    expect((buildConfig(base) as any).options.scales.y.ticks.precision).toBe(0);
    expect((buildConfig({ ...base, precision: 2 }) as any).options.scales.y.ticks.precision).toBe(2);
  });
});
