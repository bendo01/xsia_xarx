/**
 * Utility to resolve the institution logo.
 * Checks if VITE_INSTITUTION_CODE is defined in environment variables,
 * and whether client/public/img/logo/${VITE_INSTITUTION_CODE}/android-chrome-512x512.png exists.
 */

// Statically glob existing android-chrome-512x512.png logos in public directory
const logoGlob = import.meta.glob('/public/img/logo/*/android-chrome-512x512.png', { eager: true });

const availableLogoCodes = new Set<string>();
for (const key of Object.keys(logoGlob)) {
    const match = key.match(/\/img\/logo\/([^/]+)\/android-chrome-512x512\.png$/);
    if (match?.[1]) {
        availableLogoCodes.add(match[1]);
    }
}

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
