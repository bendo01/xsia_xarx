import { describe, expect, it } from 'vitest';

import { statusTone } from './status-tone';

describe('statusTone', () => {
  it.each([
    ['Aktif', 'green'],
    ['Lulus', 'blue'],
    ['Cuti', 'amber'],
    ['Sedang Double Degree', 'amber'],
    ['Keluar', 'red'],
    ['Putus Studi', 'red'],
    ['Mengundurkan Diri', 'red'],
    ['Kampus Merdeka', 'violet'],
    ['Non-Aktif', 'slate'],
    ['Tidak Aktif', 'slate'],
    ['Tidak Diketahui', 'slate'],
    ['', 'slate'],
    ['-', 'slate'],
    [null, 'slate'],
    ['Something new', 'slate'],
  ] as const)('%s -> %s', (name, tone) => {
    expect(statusTone(name)).toBe(tone);
  });
  it('does not read "non-aktif" as aktif, whatever the case', () => {
    expect(statusTone('NON AKTIF')).toBe('slate');
    expect(statusTone('AKTIF')).toBe('green');
  });
});
