import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error plain ESM script, shared with the CLI
import { extractUsage } from '../../scripts/extract-api-usage.mjs';

const FILE = path.resolve(__dirname, '../../api-usage.json');

describe('api-usage.json (what the server utility needs to grant permissions)', () => {
  const { usage, unresolved } = extractUsage();

  it('can read every API call the web app makes', () => {
    expect(unresolved).toEqual([]);
  });

  it('is up to date', () => {
    const committed = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    expect(committed, 'run: bun scripts/extract-api-usage.mjs > api-usage.json').toEqual(usage);
  });

  it('only lists relative API paths with a valid method', () => {
    for (const area of Object.values<any>(usage.areas)) {
      for (const r of area.requests) {
        expect(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).toContain(r.method);
        expect(r.path).not.toMatch(/^\/|\?|\s/);
        expect(r.sources.length).toBeGreaterThan(0);
      }
    }
  });

  it('keeps Staff-only reads out of write grants: a read-only reused file contributes only GETs', () => {
    const prodi = usage.areas['course-department'].requests as { method: string; path: string; sources: string[] }[];
    const fromEnrollmentOnly = prodi.filter((r) => r.sources.every((s) => s.startsWith('server/enrollment.ts')));
    expect(fromEnrollmentOnly.every((r) => r.method === 'GET')).toBe(true);
    // the student's own enrollment writes are not granted to the study program
    expect(prodi.some((r) => r.method === 'POST' && r.path === 'academic/student/campaign/detail-activities')).toBe(false);
  });
});
