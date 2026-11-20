import { describe, expect, it } from 'vitest';
import { safeFilename } from './files';
import { parsePage, withParams } from './url';

describe('withParams', () => {
  it('keeps existing params and applies changes', () => {
    expect(withParams({ student_id: 'a', page: '2' }, { page: 3 })).toBe('?student_id=a&page=3');
  });
  it('removes keys set to null/undefined/empty', () => {
    expect(withParams({ student_id: 'a', q: 'x' }, { q: '', page: null })).toBe('?student_id=a');
    expect(withParams({}, {})).toBe('?');
  });
  it('takes the first of repeated values and encodes', () => {
    expect(withParams({ q: ['a b', 'c'] }, {})).toBe('?q=a+b');
    expect(withParams({}, { q: 'a&b=c' })).toBe('?q=a%26b%3Dc');
  });
});

describe('parsePage', () => {
  it.each([
    ['3', 3], ['0', 1], ['-2', 1], ['abc', 1], [undefined, 1], [['4', '5'], 4], ['9999999999', 100000],
  ])('%s -> %s', (v, expected) => expect(parsePage(v as string)).toBe(expected));
});

describe('safeFilename', () => {
  it('strips path/header-breaking characters', () => {
    expect(safeFilename('KRS_A111 Ganjil 2020/2021.pdf', 'x.pdf')).toBe('KRS_A111_Ganjil_2020_2021.pdf');
    expect(safeFilename('a"\r\nSet-Cookie: x', 'x.pdf')).toBe('a_Set-Cookie_x');
    expect(safeFilename('../../etc/passwd', 'x.pdf')).toBe('etc_passwd');
  });
  it('falls back when nothing usable remains', () => {
    expect(safeFilename('///', 'doc.pdf')).toBe('doc.pdf');
    expect(safeFilename(undefined, 'doc.pdf')).toBe('doc.pdf');
  });
});
