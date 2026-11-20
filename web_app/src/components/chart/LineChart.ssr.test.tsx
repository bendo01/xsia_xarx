import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import LineChart from './LineChart';

const props = {
  categories: ['2011 / 1', '2011 / 2', '2012 / 1'],
  series: [
    { name: 'IPK', color: '#6366f1', values: [3, 3.2, 3.4], area: true },
    { name: 'IPS', color: '#0ea5e9', values: [3, 3.5, 3.8] },
  ],
  yMax: 4,
  yStep: 1,
  format: (n: number) => n.toFixed(2),
  ariaLabel: 'GPA trend',
};

describe('LineChart renders on the server', () => {
  it('draws one line per series, markers, axis labels and an accessible name', () => {
    const html = renderToString(() => <LineChart {...props} />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="GPA trend"');
    expect((html.match(/<path d="M/g) ?? []).length).toBeGreaterThanOrEqual(2); // two lines
    expect((html.match(/<circle/g) ?? []).length).toBe(6); // 2 series x 3 points
    expect(html).toContain('4.00'); // y axis top, formatted
    expect(html).toContain('2012 / 1');
  });
  it('ships the values as a screen-reader table', () => {
    const html = renderToString(() => <LineChart {...props} />);
    expect(html).toContain('class="sr-only"');
    expect(html).toContain('3.80');
  });
  it('copes with a single point and with no data', () => {
    expect(() => renderToString(() => <LineChart {...props} categories={['x']} series={[{ name: 'a', color: '#000', values: [1] }]} />)).not.toThrow();
    expect(() => renderToString(() => <LineChart {...props} categories={[]} series={[]} />)).not.toThrow();
  });
});
