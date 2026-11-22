import { describe, expect, it } from 'vitest';

import { lineFromOption, rowsFromDataset, slicesFromOption } from './unit-dashboard';

describe('unit-dashboard adapters', () => {
  it('reads a line option', () => {
    expect(lineFromOption({ xAxis: { data: ['2022', '2023'] }, series: [{ name: 'Male', data: [3, '4'] }] })).toEqual({
      categories: ['2022', '2023'],
      series: [{ name: 'Male', values: [3, 4] }],
    });
    expect(lineFromOption({ xAxis: { data: [] }, series: [] })).toBeNull();
    expect(lineFromOption(undefined)).toBeNull();
  });
  it('reads pie slices largest first and drops empty ones', () => {
    const opt = { series: [{ data: [{ name: 'b', value: 1 }, { name: 'a', value: 5 }, { name: 'z', value: 0 }] }] };
    expect(slicesFromOption(opt)).toEqual([{ name: 'a', value: 5 }, { name: 'b', value: 1 }]);
    expect(slicesFromOption({})).toEqual([]);
  });
  it('reads a dataset bar option using the encode columns', () => {
    const opt = {
      dataset: { source: [['amount', 'product'], [2, 'Kab. A'], [9, 'Kab. B'], [0, 'Kab. C']] },
      series: [{ encode: { x: 'amount', y: 'product' } }],
    };
    expect(rowsFromDataset(opt)).toEqual([{ name: 'Kab. B', value: 9 }, { name: 'Kab. A', value: 2 }]);
    expect(rowsFromDataset({ dataset: { source: [['amount', 'product']] } })).toEqual([]);
    // the real API: header names that the encode block does not mention
    const real = { dataset: { source: [['total', 'regency'], [82, 'Kab. Bogor'], [5, 'Kota Depok']] }, series: [{ encode: { x: 'amount', y: 'product' } }] };
    expect(rowsFromDataset(real)).toEqual([{ name: 'Kab. Bogor', value: 82 }, { name: 'Kota Depok', value: 5 }]);
  });
});
