import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import type { ChartSpec } from '../../lib/chartjs';
import ChartJs from './ChartJs';

const spec = (over: Partial<ChartSpec> = {}): ChartSpec => ({
  kind: 'bar',
  labels: ['2024', '2025'],
  datasets: [{ label: 'Mahasiswa', data: [10, 20] }],
  ...over,
});

describe('ChartJs (server render)', () => {
  it('renders the skeleton, an empty canvas and the numbers as a hidden table', () => {
    const html = renderToString(() => <ChartJs spec={spec()} ariaLabel="Tren" />);
    expect(html).toContain('animate-pulse'); // skeleton until chart.js has drawn
    expect(html).toContain('<canvas');
    expect(html).toContain('aria-label="Tren"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('sr-only');
    expect(html).toContain('2024');
    expect(html).toContain('>20<');
  });

  it('shapes the skeleton like the chart kind', () => {
    const ring = renderToString(() => <ChartJs spec={spec({ kind: 'doughnut' })} ariaLabel="x" />);
    expect(ring).toContain('rounded-full');
    const line = renderToString(() => <ChartJs spec={spec({ kind: 'line' })} ariaLabel="x" />);
    expect(line).toContain('clip-path');
  });
});
