import { describe, expect, it } from 'vitest';

import { ageOn, bmi, bmiCategory, fullName } from './individual-profile';

describe('bmi', () => {
  it('computes kg/m² from centimetres or metres', () => {
    expect(bmi(170, 65)).toBe(22.5);
    expect(bmi(1.7, 65)).toBe(22.5);
  });
  it('is null when height or weight is missing or zero', () => {
    expect(bmi(0, 65)).toBeNull();
    expect(bmi(170, 0)).toBeNull();
    expect(bmi(NaN, 60)).toBeNull();
  });
  it('uses the WHO categories', () => {
    expect([17, 18.5, 24.9, 25, 29.9, 30].map(bmiCategory)).toEqual(['underweight', 'normal', 'normal', 'overweight', 'overweight', 'obese']);
  });
});

describe('fullName', () => {
  it('joins titles around the name', () => {
    expect(fullName('Dr.', 'Siti Aminah', 'M.Sc.')).toBe('Dr. Siti Aminah, M.Sc.');
    expect(fullName(null, 'Budi', '')).toBe('Budi');
    expect(fullName(' Ir. ', 'Budi', undefined)).toBe('Ir. Budi');
  });
});

describe('ageOn', () => {
  const now = new Date('2026-11-22T00:00:00Z');
  it('counts whole years, not yet reaching the birthday', () => {
    expect(ageOn('2000-11-22', now)).toBe(26);
    expect(ageOn('2000-11-23', now)).toBe(25);
    expect(ageOn('2000-12-01T00:00:00', now)).toBe(25);
  });
  it('is null for invalid or future dates', () => {
    expect(ageOn('nope', now)).toBeNull();
    expect(ageOn('2030-01-01', now)).toBeNull();
    expect(ageOn(undefined, now)).toBeNull();
  });
});
