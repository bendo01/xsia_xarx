import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import Pager from './Pager';

describe('Pager (server render)', () => {
  it('without a page size it is the plain previous / next pager', () => {
    const html = renderToString(() => <Pager page={2} totalPages={3} search={{}} />);
    expect(html).toContain('rel="prev"');
    expect(html).toContain('rel="next"');
    expect(html).not.toContain('name="size"');
  });

  it('with a page size it offers the sizes, the range, and carries the other filters', () => {
    const html = renderToString(() => <Pager page={2} totalPages={5} pageSize={20} total={95} search={{ year: 'y1', q: 'ani', page: '2', size: '20' }} />);
    expect(html).toContain('name="size"');
    expect(html).toContain('<option value="50"');
    expect(html).toContain('name="year" value="y1"');
    expect(html).toContain('name="q" value="ani"');
    expect(html).not.toContain('name="page"'); // changing the size goes back to page 1
    expect(html).toMatch(/21.{0,3}40/); // "21–40 of 95"
    expect(html).toContain('page=3');
  });

  it('shows the selector on a single page of more than 10 rows, but nothing for a short list', () => {
    expect(renderToString(() => <Pager page={1} totalPages={1} pageSize={20} total={15} search={{}} />)).toContain('name="size"');
    expect(renderToString(() => <Pager page={1} totalPages={1} pageSize={20} total={8} search={{}} />)).not.toContain('<nav');
  });

  it('keeps a custom size in the list', () => {
    const html = renderToString(() => <Pager page={1} totalPages={2} pageSize={30} total={60} search={{}} />);
    expect(html).toContain('<option value="30"');
  });
});
