/**
 * Accepts only same-origin absolute paths ("/x/y?z"), so a `return_url`
 * cannot bounce a freshly signed-in user to another site. Anything else
 * (absolute URLs, `//host`, `/\host`, control characters) yields null.
 */
export function safeReturnUrl(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 2000) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) {
    return null;
  }
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(raw)) return null;
  return raw;
}
