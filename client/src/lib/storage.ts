export function isKeyExists(key: string): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(key) !== null;
}

export function getStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
}

export function removeStorageItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
}
