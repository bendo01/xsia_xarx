import { Moon, Sun } from '@lucide/solid';
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
      <Sun class="hidden size-4 shrink-0 dark:block" />
      <Moon class="block size-4 shrink-0 dark:hidden" />
    </button>
  );
}
