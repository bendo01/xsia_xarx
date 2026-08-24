export function isKeyExists(key: string): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(key) !== null || localStorage.getItem(key) !== null;
}

export function getStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

export function setStorageItem(key: string, value: string, isSession: boolean = false): void {
    if (typeof window === 'undefined') return;
    if (isSession) {
        sessionStorage.setItem(key, value);
    } else {
        localStorage.setItem(key, value);
    }
}

export function setSessionStorageItem(key: string, value: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
}

export function getSessionStorageItem(key: string): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
}

export function removeSessionStorageItem(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
}

export function removeStorageItem(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
}
