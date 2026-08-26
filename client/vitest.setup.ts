import "@testing-library/jest-dom/vitest";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

const mockLocalStorage = new MemoryStorage();
const mockSessionStorage = new MemoryStorage();

// Ensure globalThis and window have fully functional storage across Node 26+ and JSDOM
try {
  Object.defineProperty(globalThis, "localStorage", {
    value: mockLocalStorage,
    configurable: true,
    writable: true,
  });
} catch {
  // Ignore if not configurable
}

try {
  Object.defineProperty(globalThis, "sessionStorage", {
    value: mockSessionStorage,
    configurable: true,
    writable: true,
  });
} catch {
  // Ignore if not configurable
}

if (typeof window !== "undefined") {
  try {
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      configurable: true,
      writable: true,
    });
  } catch {}

  try {
    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      configurable: true,
      writable: true,
    });
  } catch {}
}
