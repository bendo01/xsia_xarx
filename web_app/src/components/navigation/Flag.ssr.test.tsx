import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import Flag from './Flag';

describe('Flag renders on the server', () => {
  it('Indonesia is two horizontal bands', () => {
    const html = renderToString(() => <Flag locale="id" />);
    expect(html).toContain('#ce1126');
    expect(html).not.toContain('clipPath');
  });
  it('United Kingdom is the Union Jack with its own clip ids', () => {
    const html = renderToString(() => <Flag locale="en" />);
    expect(html).toContain('#012169');
    expect(html).toMatch(/clip-path="url\(#[^)]+-s\)"/);
  });
  it('two flags on one page do not share clipPath ids', () => {
    const html = renderToString(() => (<div><Flag locale="en" /><Flag locale="en" /></div>));
    const ids = [...html.matchAll(/<clipPath id="([^"]+)"/gi)].map((m) => m[1]);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });
});
