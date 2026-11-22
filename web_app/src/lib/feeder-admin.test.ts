import { describe, expect, it } from 'vitest';

import { FEEDER_GROUPS, feederApiPath, inferFeederFields, matchFeederPath, parseFeederForm } from './feeder-admin';
import { FEEDER_PATHS, REFERENSI_PATHS } from '../server/feeder';

const ID = '11111111-1111-4111-8111-111111111111';

describe('matchFeederPath', () => {
  it('maps the index, lists, details and (reference only) create and edit', () => {
    expect(matchFeederPath('')).toEqual({ kind: 'index' });
    expect(matchFeederPath('master/mahasiswa')).toEqual({ kind: 'list', group: 'master', slug: 'mahasiswa' });
    expect(matchFeederPath(`master/mahasiswa/${ID}`)).toEqual({ kind: 'show', group: 'master', slug: 'mahasiswa', id: ID });
    expect(matchFeederPath('referensi/agama/create')).toEqual({ kind: 'create', group: 'referensi', slug: 'agama' });
    expect(matchFeederPath(`referensi/agama/${ID}/edit`)).toMatchObject({ kind: 'edit', id: ID });
    expect(matchFeederPath('akun/kredential')).toMatchObject({ kind: 'list' });
  });
  it('rejects unknown tables, writes on read-only groups and extra segments', () => {
    expect(matchFeederPath('master/nope')).toBeNull();
    expect(matchFeederPath('nope/agama')).toBeNull();
    expect(matchFeederPath('master/mahasiswa/create')).toBeNull();
    expect(matchFeederPath(`master/mahasiswa/${ID}/edit`)).toBeNull();
    expect(matchFeederPath(`referensi/agama/${ID}/edit/x`)).toBeNull();
  });
});

describe('feeder tables', () => {
  it('agree with the rectorat allow-lists and the api paths', () => {
    expect(FEEDER_GROUPS.master.map((s) => feederApiPath('master', s))).toEqual(Object.values(FEEDER_PATHS));
    expect(FEEDER_GROUPS.referensi.map((s) => feederApiPath('referensi', s))).toEqual(Object.values(REFERENSI_PATHS));
  });
});

describe('inferFeederFields / parseFeederForm', () => {
  const sample = { id: ID, id_agama: 1, nama_agama: 'Islam', aktif: true, extra: { a: 1 }, created_at: 'x' };
  it('infers scalar fields by value type and skips bookkeeping and objects', () => {
    expect(inferFeederFields(sample)).toEqual([{ name: 'id_agama', type: 'number' }, { name: 'nama_agama', type: 'text' }, { name: 'aktif', type: 'boolean' }]);
    expect(inferFeederFields(undefined)).toEqual([]);
  });
  it('coerces, nulls blanks and rejects bad numbers', () => {
    const fields = inferFeederFields(sample);
    expect(parseFeederForm(fields, { id_agama: '7', nama_agama: ' Hindu ', aktif: 'on', evil: 'x' })).toEqual({ ok: true, body: { id_agama: 7, nama_agama: 'Hindu', aktif: true } });
    expect(parseFeederForm(fields, { id_agama: '', nama_agama: '' })).toEqual({ ok: true, body: { id_agama: null, nama_agama: null, aktif: false } });
    expect(parseFeederForm(fields, { id_agama: 'abc' })).toMatchObject({ ok: false, errors: { id_agama: 'invalid' } });
  });
});

import { feederExportColumns } from './feeder-admin';

describe('feederExportColumns', () => {
  it('lists id first, then each scalar field once, skipping bookkeeping and objects', () => {
    expect(feederExportColumns([{ nama: 'a', id: 'x', deleted_at: null, extra: { k: 1 } }, { id: 'y', nama: 'b', baru: 2 }])).toEqual(['id', 'nama', 'baru']);
  });
  it('is empty for no rows', () => {
    expect(feederExportColumns([])).toEqual([]);
  });
});
