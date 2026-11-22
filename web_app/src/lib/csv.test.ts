import { describe, expect, it } from 'vitest';

import { csvCell, toCsv } from './csv';

describe('csvCell', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell('plain')).toBe('plain');
  });
  it('writes nothing for null and undefined, and keeps numbers and booleans', () => {
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
    expect(csvCell(-5)).toBe('-5');
    expect(csvCell(true)).toBe('true');
  });
  it('defuses text that a spreadsheet would run as a formula', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('-2')).toBe("'-2");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell('=HYPERLINK("x","y")')).toBe('"\'=HYPERLINK(""x"",""y"")"');
  });
});

describe('toCsv', () => {
  it('writes a BOM, a header and CRLF rows', () => {
    const out = toCsv([{ code: 1, name: 'A, B' }, { code: 2, name: null }], [{ field: 'code', header: 'Code' }, { field: 'name', header: 'Name' }]);
    expect(out).toBe('﻿Code,Name\r\n1,"A, B"\r\n2,\r\n');
  });
  it('writes only the header for no rows', () => {
    expect(toCsv([], [{ field: 'x', header: 'X' }])).toBe('﻿X\r\n');
  });
});
