import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

const sample = (stacked?: boolean) =>
  renderToString(() => (
    <Table stacked={stacked}>
      <TableHeader>
        <TableRow><TableHead>Kode</TableHead><TableHead>Aksi</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell label="Kode">IF101</TableCell>
          <TableCell class="text-end">buka</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ));

describe('Table (stacked cards on phones)', () => {
  it('is stacked by default: marks the table and gives each labelled cell its column name', () => {
    const html = sample();
    expect(html).toContain('data-stacked');
    expect(html).toContain('data-label="Kode"');
    expect(html).not.toContain('data-label="Aksi"'); // the actions cell has no label
  });
  it('keeps real table semantics and the header row for screen readers', () => {
    const html = sample();
    for (const tag of ['<table', '<thead', '<tbody', '<th ', '<td ']) expect(html).toContain(tag);
    expect(html).toContain('max-sm:group-data-[stacked]/table:sr-only'); // header hidden visually, not removed
    expect(html).toContain('Kode');
  });
  it('turns rows into cards and cells into label/value lines below sm', () => {
    const html = sample();
    expect(html).toContain('max-sm:group-data-[stacked]/table:rounded-xs');
    expect(html).toContain('max-sm:group-data-[stacked]/table:justify-between');
    expect(html).toContain('max-sm:group-data-[stacked]/table:before:content-[attr(data-label)]');
  });
  it('can opt out and then stays a plain scrolling table', () => {
    const html = sample(false);
    expect(html).not.toContain('data-stacked');
    expect(html).not.toContain('max-sm:overflow-visible');
  });
});
