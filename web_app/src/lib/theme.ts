/** Class-based dark mode. The inline script in Document.tsx applies it before first paint. */
export const THEME_STORAGE_KEY = 'theme';

/** Runs in <head> before paint (no flash). Kept as a string: it ships inline. */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

export function toggleTheme(): boolean {
  if (typeof document === 'undefined') return false;
  const isDark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {
    /* storage unavailable (private mode): the toggle still works for this page */
  }
  return isDark;
}
