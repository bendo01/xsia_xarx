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
