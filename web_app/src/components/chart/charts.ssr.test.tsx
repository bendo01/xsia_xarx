import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import BarChart from './BarChart';
import PieChart from './PieChart';

describe('PieChart (server render)', () => {
  const items = [{ name: 'Wajib', value: 30 }, { name: 'Pilihan', value: 10 }, { name: 'Kosong', value: 0 }];

  it('draws one slice per positive value, the total, the legend and an accessible table', () => {
    const html = renderToString(() => <PieChart items={items} ariaLabel="Kategori" totalLabel="Total" />);
    expect(html).toContain('aria-label="Kategori"');
    expect(html.match(/<path /g)).toHaveLength(2); // the zero slice is not drawn
    expect(html).toContain('>40<'); // total in the middle
    expect(html).toContain('Wajib');
    expect(html).toContain('75%');
    expect(html).toContain('sr-only');
    expect(html).not.toContain('Kosong');
  });

  it('draws a single slice as a full ring and nothing for no data', () => {
    const one = renderToString(() => <PieChart items={[{ name: 'Satu', value: 5 }]} ariaLabel="x" />);
    expect(one.match(/<path /g)).toHaveLength(1);
    expect(one).toContain('100%');
    expect(renderToString(() => <PieChart items={[]} ariaLabel="x" />).match(/<path /g)).toBeNull();
  });
});

describe('BarChart (server render)', () => {
  it('draws a bar and a value per row, limited to the first rows', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ name: `Kab ${i}`, value: 20 - i }));
    const html = renderToString(() => <BarChart items={items} ariaLabel="Wilayah" limit={5} />);
    expect(html.match(/<rect /g)).toHaveLength(5);
    expect(html).toContain('Kab 0');
    expect(html).not.toContain('Kab 5');
  });
  it('shortens very long names', () => {
    const html = renderToString(() => <BarChart items={[{ name: 'x'.repeat(100), value: 1 }]} ariaLabel="a" />);
    expect(html).toContain('…');
  });
});
