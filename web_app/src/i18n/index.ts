import { createSignal } from 'solid-js';
import { getRequestEvent, isServer } from '@solidjs/web';
import type { Locale, TranslationSchema } from './types';
import { id } from './locales/id';
import { en } from './locales/en';

/**
 * The locale lives in a cookie (not localStorage) so the server can render the
 * right language on the first byte. On the server `currentLocale()` reads the
 * REQUEST's cookie on every call: a module-level signal there would be shared
 * between concurrent requests and leak one user's language into another's.
 */
export const LOCALE_COOKIE = 'app_locale';
const DEFAULT_LOCALE: Locale = 'id';

export const dictionaries: Record<Locale, TranslationSchema> = {
    id,
    en,
};

export const SUPPORTED_LOCALES: { code: Locale; label: string; flag: string }[] = [
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function isLocale(value: unknown): value is Locale {
    return value === 'id' || value === 'en';
}

/** Pull the locale out of a `Cookie` header / `document.cookie` string. */
export function localeFromCookie(cookieHeader: string | null | undefined): Locale {
    for (const part of (cookieHeader ?? '').split(';')) {
        const [name, ...rest] = part.trim().split('=');
        if (name === LOCALE_COOKIE) {
            const value = rest.join('=');
            if (isLocale(value)) return value;
        }
    }
    return DEFAULT_LOCALE;
}

// Client state. Seeded from the cookie so the first client render matches the
// server HTML (no hydration mismatch). Never read on the server.
const [clientLocale, setClientLocale] = createSignal<Locale>(
    typeof document !== 'undefined' ? localeFromCookie(document.cookie) : DEFAULT_LOCALE,
);

/** Active locale: the request's cookie on the server, a signal in the browser. */
export function currentLocale(): Locale {
    if (isServer) {
        return localeFromCookie(getRequestEvent()?.request.headers.get('cookie'));
    }
    return clientLocale();
}

export function getLocale(): Locale {
    return currentLocale();
}

/** Set the active locale (browser only) and persist it in the cookie. */
export function setLocale(locale: Locale): void {
    if (!isLocale(locale) || isServer) return;
    setClientLocale(locale);
    document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

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
