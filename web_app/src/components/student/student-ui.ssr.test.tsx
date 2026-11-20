import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import LockStatus from './LockStatus';
import PrintLink from './PrintLink';

// The padlock paths differ: a closed lock's shackle ends at "v4", the open one's at "9.9-1".
const CLOSED = 'M7 11V7a5 5 0 0 1 10 0v4';
const OPEN = 'M7 11V7a5 5 0 0 1 9.9-1';

describe('LockStatus', () => {
  it('shows a closed padlock and the word for a locked item', () => {
    const html = renderToString(() => <LockStatus locked />);
    expect(html).toContain(CLOSED);
    expect(html).not.toContain(OPEN);
    expect(html).toContain('Terkunci');
    expect(html).toContain('aria-hidden="true"'); // decorative: the word carries the meaning
  });
  it('shows an open padlock for an unlocked item', () => {
    const html = renderToString(() => <LockStatus locked={false} />);
    expect(html).toContain(OPEN);
    expect(html).not.toContain(CLOSED);
    expect(html).toContain('Tidak Terkunci');
  });
});

describe('PrintLink', () => {
  it('is a new-tab link with a printer icon and its label', () => {
    const html = renderToString(() => <PrintLink href="/api/student/print/krs/x?name=KRS" label="KRS" title="Cetak KRS" />);
    expect(html).toContain('href="/api/student/print/krs/x?name=KRS"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener"');
    expect(html).toContain('title="Cetak KRS"');
    expect(html).toContain('<svg');
    expect(html).toContain('M6 9V3'); // the printer's paper tray
    expect(html).toContain('KRS</a>');
  });
  it('has a bordered button style for page headers', () => {
    const html = renderToString(() => <PrintLink variant="button" href="/x" label="Cetak KHS" />);
    expect(html).toContain('border-layer-line');
    expect(html).toContain('Cetak KHS');
  });
});
