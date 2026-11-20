import { env } from 'virtual:solid-env/client';

/** Public URL of the institution logo for the configured code, or null if none is set. */
export function getInstitutionLogo(code: string = env.VITE_INSTITUTION_CODE): string | null {
  const clean = code.replace(/^["']|["']$/g, '').trim();
  // Codes name a folder under public/img/logo: keep the URL to a single safe segment.
  if (!/^[A-Za-z0-9_-]+$/.test(clean)) return null;
  return `/img/logo/${clean}/android-chrome-512x512.png`;
}
