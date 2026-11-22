import { describe, expect, it } from 'vitest';
import { safeHttpsUrl, validateAccountAcquisition, validateAdmission, validateForgotPassword, validateResetPassword, validateVerifyToken } from './validation';

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

describe('public registration validation', () => {
  const acq = { nik: '1', student_code: 'A1', email: 'a@b.co', phone_number: '628123456789', password: 'secret1' };
  it('account acquisition', () => {
    expect(validateAccountAcquisition(acq)).toBeNull();
    expect(validateAccountAcquisition({ ...acq, nik: ' ' })).toBe('au.semuaKolomHarusDiisi');
    expect(validateAccountAcquisition({ ...acq, email: 'nope' })).toBe('au.emailTidakValid');
    expect(validateAccountAcquisition({ ...acq, phone_number: '12' })).toBe('au.nomorWhatsAppTidakValid');
    expect(validateAccountAcquisition({ ...acq, password: '123' })).toBe('au.kataSandiMinimal6Karakter2');
  });
  const adm = {
    name: 'Ani', nik: '1234567890123456', birth_place: 'Jakarta', birth_date: '2008-01-01', gender_id: 'g', religion_id: 'r',
    student_national_number: '', school_name: '', phone_number: '628123456789', email: 'a@b.co', password: 'secret1', password_confirmation: 'secret1',
  };
  it('candidate admission', () => {
    expect(validateAdmission(adm)).toBeNull();
    expect(validateAdmission({ ...adm, name: '' })).toBe('au.semuaKolomHarusDiisi');
    expect(validateAdmission({ ...adm, nik: '123' })).toBe('au.nikHarus16DigitAngka');
    expect(validateAdmission({ ...adm, student_national_number: '12' })).toBe('au.nisnHarus10DigitAngka');
    expect(validateAdmission({ ...adm, password_confirmation: 'x' })).toBe('au.konfirmasiKataSandiTidakSama');
  });
});
