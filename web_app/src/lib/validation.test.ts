import { describe, expect, it } from 'vitest';
import { safeHttpsUrl, validateForgotPassword, validateResetPassword, validateVerifyToken } from './validation';

const uuid = '123e4567-e89b-42d3-a456-426614174000';

describe('validation', () => {
  it('forgot password needs both fields', () => {
    expect(validateForgotPassword({ email: 'a@b.c', phone_number: '' })).toBe('au.semuaKolomHarusDiisi');
    expect(validateForgotPassword({ email: ' ', phone_number: '08' })).toBe('au.semuaKolomHarusDiisi');
    expect(validateForgotPassword({ email: 'a@b.c', phone_number: '08' })).toBeNull();
  });
  it('reset password checks token, fields, then match, in that order', () => {
    const ok = { token: uuid, new_password: 'secret1', confirm_password: 'secret1' };
    expect(validateResetPassword({ ...ok, token: '' })).toBe('au.tokenResetWajibDiisi');
    expect(validateResetPassword({ ...ok, token: 'nope' })).toBe('au.formatTokenTidakValid');
    expect(validateResetPassword({ ...ok, confirm_password: '' })).toBe('au.semuaKolomHarusDiisi');
    expect(validateResetPassword({ ...ok, confirm_password: 'x' })).toBe('au.kataSandiTidakCocok');
    expect(validateResetPassword(ok)).toBeNull();
  });
  it('verify token', () => {
    expect(validateVerifyToken('')).toBe('au.tokenVerifikasiWajibDiisi');
    expect(validateVerifyToken('x')).toBe('au.formatTokenTidakValid');
    expect(validateVerifyToken(uuid)).toBeNull();
  });
});

describe('safeHttpsUrl', () => {
  it('accepts https only', () => {
    expect(safeHttpsUrl('https://wa.me/628123?text=hi')).toBe('https://wa.me/628123?text=hi');
    expect(safeHttpsUrl('http://wa.me/1')).toBeNull();
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull();
    expect(safeHttpsUrl('not a url')).toBeNull();
    expect(safeHttpsUrl(undefined)).toBeNull();
  });
});
