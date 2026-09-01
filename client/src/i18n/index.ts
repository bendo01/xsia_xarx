import { createSignal } from 'solid-js';
import type { Locale, TranslationSchema } from './types';
import { id } from './locales/id';
import { en } from './locales/en';

export const LOCALE_STORAGE_KEY = 'app_locale';

export const dictionaries: Record<Locale, TranslationSchema> = {
    id,
    en,
};

export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

/**
 * Detect user's initial locale based on stored preference or browser language
 */
export function detectInitialLocale(): Locale {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (stored === 'id' || stored === 'en') {
            return stored;
        }
    }

    if (typeof navigator !== 'undefined') {
        const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
        if (browserLang.toLowerCase().startsWith('id')) {
            return 'id';
        }
    }

    return 'id'; // Default to Indonesian
}

// Global reactive locale signal
export const [currentLocale, setCurrentLocaleSignal] = createSignal<Locale>(detectInitialLocale());

/**
 * Get current active locale
 */
export function getLocale(): Locale {
    return currentLocale();
}

/**
 * Set active locale and persist to storage
 */
export function setLocale(locale: Locale): void {
    if (locale !== 'id' && locale !== 'en') return;
    setCurrentLocaleSignal(locale);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    }
}

/**
 * Toggle between 'id' and 'en'
 */
export function toggleLocale(): Locale {
    const next = currentLocale() === 'id' ? 'en' : 'id';
    setLocale(next);
    return next;
}

/**
 * Helper to retrieve a nested property using dot-notation path
 */
function getNestedValue(obj: any, path: string): string | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null || typeof current !== 'object') {
            return undefined;
        }
        current = current[part];
    }
    return typeof current === 'string' ? current : undefined;
}

/**
 * Translation function with nested key support and parameter interpolation
 * Usage: t('auth.login.welcomeBack', { name: 'Alan' })
 */
export function t(key: string, params?: Record<string, string | number>): string {
    const loc = currentLocale();
    const dict = dictionaries[loc];
    let template = getNestedValue(dict, key);

    // Fallback to English dictionary if key is missing in current locale
    if (template === undefined && loc !== 'en') {
        template = getNestedValue(dictionaries.en, key);
    }

    // If still missing, return the key path
    if (template === undefined) {
        return key;
    }

    // Parameter interpolation for {{key}} and {key}
    if (params) {
        let result = template;
        for (const [paramKey, paramValue] of Object.entries(params)) {
            const val = String(paramValue);
            result = result
                .replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), val)
                .replace(new RegExp(`{\\s*${paramKey}\\s*}`, 'g'), val);
        }
        return result;
    }

    return template;
}

/**
 * Format a Date according to current or given locale
 */
export function formatDate(
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
    locale?: Locale
): string {
    const loc = locale || currentLocale();
    const intlLocale = loc === 'id' ? 'id-ID' : 'en-US';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat(intlLocale, options ?? {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d);
}

/**
 * Format currency according to current or given locale
 */
export function formatCurrency(
    amount: number,
    currency: string = 'IDR',
    locale?: Locale
): string {
    const loc = locale || currentLocale();
    const intlLocale = loc === 'id' ? 'id-ID' : 'en-US';
    return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency,
        maximumFractionDigits: currency === 'IDR' ? 0 : 2,
    }).format(amount);
}

/**
 * Format standard numbers
 */
export function formatNumber(
    value: number,
    options?: Intl.NumberFormatOptions,
    locale?: Locale
): string {
    const loc = locale || currentLocale();
    const intlLocale = loc === 'id' ? 'id-ID' : 'en-US';
    return new Intl.NumberFormat(intlLocale, options).format(value);
}

export * from './types';
