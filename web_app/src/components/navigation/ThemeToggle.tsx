import { toggleTheme } from '../../lib/theme';
import { t } from '../../i18n';

export default function ThemeToggle() {
  return (
    <button
      onClick={toggleTheme}
      type="button"
      class="flex size-8 items-center justify-center rounded-xs border border-neutral-300 bg-white text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-neutral-100 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
      aria-label={t('nav.toggleDarkMode')}
      title={t('nav.toggleDarkMode')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden size-4 shrink-0 dark:block"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="block size-4 shrink-0 dark:hidden"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
    </button>
  );
}
