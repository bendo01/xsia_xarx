import { t, getLocale, toggleLocale } from '../../i18n';

export default function LocaleToggle() {
    return (
        <button
            onClick={toggleLocale}
            type="button"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-neutral-900/5 dark:bg-white/10 hover:bg-neutral-900/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-900 dark:text-white text-xs font-semibold backdrop-blur-md transition-all shadow-lg"
            aria-label={t('nav.selectLanguage')}
            title={t('nav.selectLanguage')}
        >
            <span class="text-sm">{getLocale() === 'id' ? '🇮🇩' : '🇬🇧'}</span>
            <span class="font-mono text-xs uppercase font-bold">{getLocale()}</span>
        </button>
    );
}
