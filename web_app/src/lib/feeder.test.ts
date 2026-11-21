import { describe, expect, it } from 'vitest';

import { FEEDER_PATHS } from '../server/feeder';
import { FEEDER_SLUGS, feederCell, feederColumns, feederLabel, feederTitle } from './feeder';

describe('feeder helpers', () => {
  it('slug list matches the server allow-list', () => {
    expect([...FEEDER_SLUGS].sort()).toEqual(Object.keys(FEEDER_PATHS).sort());
    expect(FEEDER_SLUGS).toHaveLength(49);
  });
  it('humanises slugs and keys', () => {
    expect(feederTitle('kelas-kuliah')).toBe('Kelas Kuliah');
    expect(feederLabel('nama_mahasiswa')).toBe('Nama Mahasiswa');
  });
  it('picks readable scalar columns', () => {
    const rows = [{ id: 'x', id_fakultas: 'g', nama_fakultas: 'Teknik', status: 'A', nested: { a: 1 }, created_at: 'd', sync_at: null }];
    expect(feederColumns(rows)).toEqual(['nama_fakultas', 'status']);
  });
  it('falls back to id_* columns and caps the count', () => {
    expect(feederColumns([{ id_a: '1', id_b: '2' }])).toEqual(['id_a', 'id_b']);
    expect(feederColumns([{ a: 1, b: 2, c: 3 }], 2)).toEqual(['a', 'b']);
    expect(feederColumns([])).toEqual([]);
  });
  it('formats cells', () => {
    expect(feederCell(null)).toBe('-');
    expect(feederCell(true)).toBe('✓');
    expect(feederCell(0)).toBe('0');
  });
});
