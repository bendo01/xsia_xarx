import { getLocale, t, toggleLocale } from '../../i18n';
import Flag from './Flag';

export default function LocaleToggle() {
  return (
    <button
      onClick={toggleLocale}
      type="button"
      class="flex items-center gap-1.5 rounded-xs border border-neutral-200 bg-neutral-900/5 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-neutral-900/10 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
      aria-label={t('nav.selectLanguage')}
      title={t('nav.selectLanguage')}
    >
      <Flag locale={getLocale()} />
      <span class="font-mono text-xs font-bold uppercase">{getLocale()}</span>
    </button>
  );
}
