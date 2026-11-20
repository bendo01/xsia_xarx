import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { dictionaries } from './index';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|ts)$/.test(name) && !/\.test\./.test(name)) out.push(p);
  }
  return out;
}

const has = (dict: unknown, key: string) =>
  key.split('.').reduce<unknown>((o, k) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[k] : undefined), dict) !== undefined;

describe('translation keys used in source exist in both languages', () => {
  const used = new Map<string, string>();
  for (const file of walk('src')) {
    const src = readFileSync(file, 'utf8');
    // t('a.b'), t("a.b") and the 'au.xxx' keys validation.ts returns.
    for (const m of src.matchAll(/\bt\(\s*['"]([A-Za-z0-9_.]+)['"]/g)) used.set(m[1], file);
    if (file.endsWith('validation.ts')) {
      for (const m of src.matchAll(/'((?:au)\.[A-Za-z0-9_]+)'/g)) used.set(m[1], file);
    }
  }

  it('found some keys to check', () => expect(used.size).toBeGreaterThan(5));

  it.each([...used])('%s', (key, file) => {
    expect(has(dictionaries.id, key), `${key} missing in id (used in ${file})`).toBe(true);
    expect(has(dictionaries.en, key), `${key} missing in en (used in ${file})`).toBe(true);
  });
});
