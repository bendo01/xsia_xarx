import { describe, expect, it } from 'vitest';

import { resolveUnitId } from './unit-select';

const U = '123e4567-e89b-42d3-a456-426614174011';
const V = '223e4567-e89b-42d3-a456-426614174022';

describe('resolveUnitId', () => {
  it('keeps a real id', () => expect(resolveUnitId(U, null)).toBe(U));
  it('resolves placeholders from the role unit', () => {
    expect(resolveUnitId('[id]', { id: 'r', name: 'Kepala Program Studi', unit_id: V } as any)).toBe(V);
    expect(resolveUnitId('', { id: 'r', name: 'x', unit_id: V } as any)).toBe(V);
  });
  it('uses roleable_id only for non-staff roles', () => {
    expect(resolveUnitId('[id]', { id: 'r', name: 'Prodi', roleable_id: U, roleable_type: 'Unit' } as any)).toBe(U);
    expect(resolveUnitId('[id]', { id: 'r', name: 'Staff Program Studi', roleable_id: U, roleable_type: 'Staff' } as any)).toBeNull();
  });
  it('rejects junk', () => {
    expect(resolveUnitId('../x', null)).toBeNull();
    expect(resolveUnitId('[id]', null)).toBeNull();
  });
});
