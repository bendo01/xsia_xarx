import { describe, it, expect, beforeEach } from 'vitest';
import {
    t,
    setLocale,
    getLocale,
    toggleLocale,
    formatDate,
    formatCurrency,
    formatNumber,
    detectInitialLocale,
    LOCALE_STORAGE_KEY,
    dictionaries
} from './index';

describe('i18n Localization Engine', () => {
    beforeEach(() => {
        localStorage.clear();
        setLocale('id');
    });

    it('translates nested keys in Bahasa Indonesia (id)', () => {
        setLocale('id');
        expect(t('common.save')).toBe('Simpan');
        expect(t('common.cancel')).toBe('Batal');
        expect(t('roles.student')).toBe('Mahasiswa');
        expect(t('roles.lecturer')).toBe('Dosen');
        expect(t('roles.administrator')).toBe('Administrator');
        expect(t('roles.course_department')).toBe('Program Studi & Jurusan');
        expect(t('nav.signInJwt')).toBe('Masuk Akun (JWT)');
        expect(t('auth.login.title')).toBe('Macro Workspace');
    });

    it('translates nested keys in English (en)', () => {
        setLocale('en');
        expect(t('common.save')).toBe('Save');
        expect(t('common.cancel')).toBe('Cancel');
        expect(t('roles.student')).toBe('Student');
        expect(t('roles.lecturer')).toBe('Lecturer');
        expect(t('roles.administrator')).toBe('Administrator');
        expect(t('roles.course_department')).toBe('Course & Department');
        expect(t('nav.signInJwt')).toBe('Sign In (JWT)');
    });

    it('interpolates parameters using {{param}} and {param}', () => {
        setLocale('id');
        expect(t('auth.login.welcomeBack', { name: 'Budi' })).toBe('Selamat datang kembali, Budi!');
        expect(t('nav.rolesAvailable', { count: 3 })).toBe('Tersedia 3 Peran');

        setLocale('en');
        expect(t('auth.login.welcomeBack', { name: 'Alice' })).toBe('Welcome back, Alice!');
        expect(t('nav.rolesAvailable', { count: 3 })).toBe('3 Roles Available');
    });

    it('toggles locale between id and en', () => {
        setLocale('id');
        expect(getLocale()).toBe('id');
        
        const toggled1 = toggleLocale();
        expect(toggled1).toBe('en');
        expect(getLocale()).toBe('en');
        expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');

        const toggled2 = toggleLocale();
        expect(toggled2).toBe('id');
        expect(getLocale()).toBe('id');
        expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('id');
    });

    it('falls back to key if translation key does not exist', () => {
        expect(t('non.existent.key')).toBe('non.existent.key');
    });

    it('formats dates according to locale', () => {
        const testDate = new Date('2026-08-17T10:00:00Z');
        const formattedId = formatDate(testDate, { year: 'numeric', month: 'long', day: 'numeric' }, 'id');
        const formattedEn = formatDate(testDate, { year: 'numeric', month: 'long', day: 'numeric' }, 'en');

        expect(formattedId).toContain('2026');
        expect(formattedEn).toContain('2026');
        expect(formattedId).toContain('Agustus');
        expect(formattedEn).toContain('August');
    });

    it('formats currency correctly (IDR vs USD)', () => {
        const amount = 150000;
        const idr = formatCurrency(amount, 'IDR', 'id');
        const usd = formatCurrency(amount, 'USD', 'en');

        expect(idr).toContain('Rp');
        expect(idr).toContain('150.000');
        expect(usd).toContain('$');
    });

    it('formats numbers with locale separators', () => {
        const num = 1234567.89;
        const formattedId = formatNumber(num, undefined, 'id');
        const formattedEn = formatNumber(num, undefined, 'en');

        // Indonesian uses comma for decimal and dot for thousand separator
        expect(formattedId).toContain('1.234.567');
        // English uses dot for decimal and comma for thousand separator
        expect(formattedEn).toContain('1,234,567');
    });

    it('detects initial locale from localStorage if available', () => {
        localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
        expect(detectInitialLocale()).toBe('en');

        localStorage.setItem(LOCALE_STORAGE_KEY, 'id');
        expect(detectInitialLocale()).toBe('id');
    });

    it('ensures dictionary key parity between id and en', () => {
        const getKeys = (obj: any, prefix = ''): string[] => {
            let keys: string[] = [];
            for (const k in obj) {
                const fullKey = prefix ? `${prefix}.${k}` : k;
                if (typeof obj[k] === 'object' && obj[k] !== null) {
                    keys = keys.concat(getKeys(obj[k], fullKey));
                } else {
                    keys.push(fullKey);
                }
            }
            return keys;
        };

        const idKeys = getKeys(dictionaries.id).sort();
        const enKeys = getKeys(dictionaries.en).sort();

        expect(idKeys).toEqual(enKeys);
    });
});
