import { flush } from 'solid-js';
import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LineChart from './LineChart';

// jsdom has no layout: give the chart a container width and a ResizeObserver we can trigger.
let width = 330;
let trigger: (() => void) | null = null;
const disconnect = vi.fn();

beforeEach(() => {
  width = 330;
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => width });
  globalThis.ResizeObserver = class {
    constructor(cb: () => void) { trigger = cb; }
    observe() {}
    unobserve() {}
    disconnect = disconnect;
  } as unknown as typeof ResizeObserver;
});
afterEach(() => {
  cleanup();
  disconnect.mockClear();
  trigger = null;
});

const props = {
  categories: ['2021 / 1', '2021 / 2', '2022 / 1', '2022 / 2', '2023 / 1', '2023 / 2'],
  series: [{ name: 'IPK', color: '#6366f1', values: [3, 3.1, 3.2, 3.3, 3.4, 3.5] }],
  yMax: 4,
  yStep: 1,
  ariaLabel: 'GPA',
};
const svg = (c: HTMLElement) => c.querySelector('svg')!;
const xLabels = (c: HTMLElement) => [...svg(c).querySelectorAll('text[y="212"]')].map((t) => t.textContent); // H(220) - 8
const anchors = (c: HTMLElement) => [...svg(c).querySelectorAll('text[y="212"]')].map((t) => t.getAttribute('text-anchor'));

describe('LineChart responsive width', () => {
  it('draws at the container width, not a fixed 640, so text keeps its size on a phone', async () => {
    const { container } = render(() => <LineChart {...props} />);
    flush();
    expect(svg(container).getAttribute('viewBox')).toBe('0 0 330 220');
  });

  it('redraws when the container is resized, and stops observing on unmount', async () => {
    const { container, unmount } = render(() => <LineChart {...props} />);
    flush();
    width = 520;
    trigger!();
    flush();
    expect(svg(container).getAttribute('viewBox')).toBe('0 0 520 220');
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('shows fewer x labels when narrow (always keeping the newest) and all of them when wide', () => {
    const narrow = render(() => <LineChart {...props} />);
    flush();
    const few = xLabels(narrow.container);
    expect(few.length).toBeLessThan(props.categories.length);
    expect(few.at(-1)).toBe('2023 / 2');
    cleanup();

    width = 900;
    const wide = render(() => <LineChart {...props} />);
    flush();
    expect(xLabels(wide.container)).toEqual(props.categories);
  });

  it('anchors the first label inward and the last label inward so neither is cut off at the edge', () => {
    width = 900;
    const { container } = render(() => <LineChart {...props} />);
    flush();
    const a = anchors(container);
    expect(a[0]).toBe('start');
    expect(a.at(-1)).toBe('end');
    expect(a.slice(1, -1).every((x) => x === 'middle')).toBe(true);
  });

  it('never goes below a minimum width', () => {
    width = 50;
    const { container } = render(() => <LineChart {...props} />);
    flush();
    expect(svg(container).getAttribute('viewBox')).toBe('0 0 260 220');
  });

  it('uses tickFormat for the axis and format for the tooltip values', () => {
    const { container } = render(() => (
      <LineChart {...props} categories={['a', 'b']} series={[{ name: 'SKS', color: '#000', values: [20, 40] }]} yMax={40} yStep={20} format={(n) => `${n} SKS`} tickFormat={String} />
    ));
    flush();
    const ticks = [...svg(container).querySelectorAll('text[x="36"]')].map((t) => t.textContent); // y ticks: PAD.left - 8
    expect(ticks).toEqual(['0', '20', '40']); // short: fits the left margin
    expect(container.querySelector('.sr-only')?.textContent).toContain('40 SKS'); // full text where there is room
  });
});
