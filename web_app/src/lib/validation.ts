// Input checks shared by the account pages. Each returns an i18n key for the
// first problem, or null when the input is fine, so the UI stays translatable.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: string) => UUID_RE.test(v);

export function validateForgotPassword(v: { email: string; phone_number: string }): string | null {
  return !v.email.trim() || !v.phone_number.trim() ? 'au.semuaKolomHarusDiisi' : null;
}

export function validateResetPassword(v: {
  token: string;
  new_password: string;
  confirm_password: string;
}): string | null {
  if (!v.token) return 'au.tokenResetWajibDiisi';
  if (!isUuid(v.token)) return 'au.formatTokenTidakValid';
  if (!v.new_password || !v.confirm_password) return 'au.semuaKolomHarusDiisi';
  if (v.new_password !== v.confirm_password) return 'au.kataSandiTidakCocok';
  return null;
}

export function validateVerifyToken(token: string): string | null {
  if (!token) return 'au.tokenVerifikasiWajibDiisi';
  if (!isUuid(token)) return 'au.formatTokenTidakValid';
  return null;
}

/** Only https links may be rendered as outbound links (the API supplies `wa_link`). */
export function safeHttpsUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?\d{8,20}$/;
const NIK_RE = /^\d{16}$/;

/** Account acquisition: an existing student claims a login (NIK + student code + contact). */
export function validateAccountAcquisition(v: {
  nik: string;
  student_code: string;
  email: string;
  phone_number: string;
  password: string;
}): string | null {
  if (!v.nik.trim() || !v.student_code.trim() || !v.email.trim() || !v.phone_number.trim() || !v.password) {
    return 'au.semuaKolomHarusDiisi';
  }
  if (!EMAIL_RE.test(v.email.trim())) return 'au.emailTidakValid';
  if (!PHONE_RE.test(v.phone_number.trim())) return 'au.nomorWhatsAppTidakValid';
  if (v.password.length < 6) return 'au.kataSandiMinimal6Karakter2';
  return null;
}

export interface AdmissionForm {
  name: string;
  nik: string;
  birth_place: string;
  birth_date: string;
  gender_id: string;
  religion_id: string;
  student_national_number: string;
  school_name: string;
  phone_number: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** Candidate self-registration: the i18n key of the first problem, or null. */
export function validateAdmission(v: AdmissionForm): string | null {
  if (!v.name.trim() || !v.birth_place.trim() || !v.birth_date || !v.gender_id || !v.religion_id) {
    return 'au.semuaKolomHarusDiisi';
  }
  if (!NIK_RE.test(v.nik.trim())) return 'au.nikHarus16DigitAngka';
  if (!PHONE_RE.test(v.phone_number.trim())) return 'au.nomorWhatsAppTidakValid';
  if (v.student_national_number.trim() && !/^\d{10}$/.test(v.student_national_number.trim())) return 'au.nisnHarus10DigitAngka';
  if (!EMAIL_RE.test(v.email.trim())) return 'au.emailTidakValid';
  if (v.password.length < 6) return 'au.kataSandiMinimal6Karakter2';
  if (v.password !== v.password_confirmation) return 'au.konfirmasiKataSandiTidakSama';
  return null;
}
