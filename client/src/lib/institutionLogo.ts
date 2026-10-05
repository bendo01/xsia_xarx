/**
 * Utility to resolve the institution logo.
 * Checks if VITE_INSTITUTION_CODE is defined in environment variables,
 * and whether client/public/img/logo/${VITE_INSTITUTION_CODE}/android-chrome-512x512.png exists.
 */

import {
    availableLogoCodes as rawLogoCodes,
    availableFaviconCodes as rawFaviconCodes,
} from '~/config/institutionAssets';

const availableLogoCodes = new Set<string>(rawLogoCodes);
const availableFaviconCodes = new Set<string>(rawFaviconCodes);

/**
 * Returns the configured institution code from environment variables.
 */
export function getInstitutionCode(): string {
    const raw =
        import.meta.env.VITE_INSTITUTION_CODE ||
        (import.meta.env as any).CURRENT_INSTITUTION_CODE ||
        (typeof process !== 'undefined' && process.env?.VITE_INSTITUTION_CODE) ||
        '';
    return String(raw).replace(/^["']|["']$/g, '').trim();
}

/**
 * Checks whether an institution logo exists for the given code (or currently configured code).
 */
export function hasInstitutionLogo(code?: string): boolean {
    const targetCode = (code !== undefined ? code : getInstitutionCode()).replace(/^["']|["']$/g, '').trim();
    if (!targetCode) return false;
    return availableLogoCodes.has(targetCode);
}

/**
 * Returns the public URL of the institution logo if it exists, or null.
 * Example: /img/logo/092010/android-chrome-512x512.png
 */
export function getInstitutionLogo(code?: string): string | null {
    const targetCode = (code !== undefined ? code : getInstitutionCode()).replace(/^["']|["']$/g, '').trim();
    if (!targetCode) return null;
    if (availableLogoCodes.has(targetCode)) {
        return `/img/logo/${targetCode}/android-chrome-512x512.png`;
    }
    return null;
}

/**
 * Checks whether an institution favicon exists for the given code (or currently configured code).
 */
export function hasInstitutionFavicon(code?: string): boolean {
    const targetCode = (code !== undefined ? code : getInstitutionCode()).replace(/^["']|["']$/g, '').trim();
    if (!targetCode) return false;
    return availableFaviconCodes.has(targetCode);
}

/**
 * Returns the public URL of the institution favicon if it exists, or /favicon.ico fallback.
 * Example: /img/logo/092010/favicon.ico
 */
export function getInstitutionFavicon(code?: string): string {
    const targetCode = (code !== undefined ? code : getInstitutionCode()).replace(/^["']|["']$/g, '').trim();
    if (targetCode && availableFaviconCodes.has(targetCode)) {
        return `/img/logo/${targetCode}/favicon.ico`;
    }
    return '/favicon.ico';
}

