#!/usr/bin/env node
// Lists the Rust API requests the web app's server code makes, per area, in the JSON shape that
// `utility:generate-permission-from-client` (server) reads:
//   { areas: { <area>: { requests: [{ method, path, sources }], unresolved: [] } } }
//
// The web app talks to the API only from the server (src/server/*.ts and src/routes/api/**), always
// through apiFetch / apiFetchRaw / apiPaginated, so a small static reader is enough: it finds those
// calls, evaluates the first argument (string / template literal, constants, and the lookup tables
// the code uses) and takes the HTTP method from the call's options.
//
// Usage: bun scripts/extract-api-usage.mjs > api-usage.json     (a vitest keeps the file current)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');

/** area -> files; `readOnly` areas only get the GETs of a file (they reuse a read function of it). */
export const AREAS = {
  'course-department': [
    { file: 'server/crud.ts' },
    { file: 'server/unit.ts' },
    { file: 'server/final-assignment.ts' },
    { file: 'server/lecturer.ts', readOnly: true },
    { file: 'server/student.ts', readOnly: true },
    { file: 'server/enrollment.ts', readOnly: true },
    { file: 'routes/api/student/print/[kind]/[id].ts' },
  ],
  // Rectorat is read-only: the institution loaders, the per-unit loaders they reuse and the GETs of the generic list.
  rectorat: [
    { file: 'server/institution.ts' },
    { file: 'server/feeder.ts' },
    { file: 'server/unit.ts' },
    { file: 'server/crud.ts', readOnly: true },
  ],
  // The writes (staff appointments, employees): a narrower area than rectorat (see utility_12).
  'rectorat-admin': [{ file: 'server/institution-write.ts' }],
  lecturer: [
    { file: 'server/lecturer.ts' },
    { file: 'server/grading.ts' },
    { file: 'server/attendance.ts' },
    { file: 'routes/api/lecturer/print/[kind]/[id].ts' },
    { file: 'routes/api/realtime/meeting/[id].ts' },
  ],
  student: [
    { file: 'server/student.ts' },
    { file: 'server/enrollment.ts' },
    { file: 'routes/api/student/print/[kind]/[id].ts' },
    { file: 'routes/api/realtime/enrollment/[id].ts' },
  ],
  _shared: [{ file: 'server/auth.ts' }],
};

// The helpers are thin wrappers (a GET with error handling); their callers hold the literal paths.
const CALLS = /\b(apiFetchRaw|apiFetch|apiPaginated|showOrNull|listOrEmpty|fetchById)\s*(?:<[^>()]*>)?\(/g;
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

/** Text of the call's argument list, from just after "(" to its matching ")". */
function argsOf(src, from) {
  let depth = 1, i = from, quote = null;
  for (; i < src.length && depth > 0; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      else if (quote === '`' && c === '$' && src[i + 1] === '{') {
        // skip the whole ${...}
        let d = 1;
        i += 2;
        for (; i < src.length && d > 0; i++) {
          if (src[i] === '{') d++;
          else if (src[i] === '}') d--;
        }
        i--;
      }
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '(' || c === '{' || c === '[') depth++;
    else if (c === ')' || c === '}' || c === ']') depth--;
  }
  return src.slice(from, i - 1);
}

/** First top-level argument. */
function firstArg(args) {
  let depth = 0, quote = null;
  for (let i = 0; i < args.length; i++) {
    const c = args[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "'" || c === '"' || c === '`') quote = c;
    else if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) depth--;
    else if (c === ',' && depth === 0) return args.slice(0, i).trim();
  }
  return args.trim();
}

const stringsIn = (text) => [...text.matchAll(/(?:path:\s*|:\s*)'([^']+)'/g)].map((m) => m[1]);

/** Values of every `const NAME = {...}` / `const NAME: T = {...}` object literal of strings in a file. */
function tables(src) {
  const out = {};
  for (const m of src.matchAll(/const (\w+)(?::[^=]+)?=\s*\{/g)) {
    let d = 1, i = m.index + m[0].length;
    for (; i < src.length && d > 0; i++) {
      if (src[i] === '{') d++;
      else if (src[i] === '}') d--;
    }
    out[m[1]] = stringsIn(src.slice(m.index + m[0].length, i - 1)).filter((s) => /^[a-z0-9_\-/]+$/i.test(s));
  }
  return out;
}

const consts = (src) => Object.fromEntries([...src.matchAll(/^const (\w+) = '([^']*)';?$/gm)].map((m) => [m[1], m[2]]));

function resolver(file, src) {
  const own = consts(src);
  const tabs = tables(src);
  const resources = read('lib/crud-schema.ts');
  const resourcePaths = [...resources.matchAll(/^\s+\w+:\s*\{\s*path:\s*'([^']+)'/gm)].map((m) => m[1]);
  const resourceByKey = Object.fromEntries([...resources.matchAll(/^\s+(\w+):\s*\{\s*path:\s*'([^']+)'/gm)].map((m) => [m[1], m[2]]));
  const lookups = stringsIn(read('lib/final-assignment-defs.ts').split('export const LOOKUP_PATHS')[1]?.split('};')[0] ?? '');
  const faPaths = [...read('lib/final-assignment-defs.ts').matchAll(/^\s+path:\s*'([^']+)'/gm)].map((m) => m[1]);
  const lookupPaths = [...(read('lib/final-assignment-defs.ts').split('export const LOOKUP_PATHS')[1]?.split('};')[0] ?? '').matchAll(/:\s*'([^']+)'/g)].map((m) => m[1]);
  void lookups;

  /** Alternatives for one `${expr}` (or a bare argument expression); null = not resolvable. */
  return (expr) => {
    expr = expr.trim();
    if (/^enc\(/.test(expr) || /^encodeURIComponent\(/.test(expr)) return ['{}'];
    if (own[expr] !== undefined) return [own[expr]];
    let m = /^RESOURCES\.(\w+)\.path$/.exec(expr);
    if (m && resourceByKey[m[1]]) return [resourceByKey[m[1]]];
    if (/^RESOURCES\[[^\]]+\]\.path$/.test(expr)) return resourcePaths;
    if (/^LOOKUP_PATHS\[[^\]]+\]$/.test(expr)) return lookupPaths;
    if (/^def\.path$/.test(expr)) return faPaths;
    if (/^\w+\.path$/.test(expr)) {
      // a loop / table entry holding a path segment (e.g. the print route's KINDS[kind].path)
      const segs = [...src.matchAll(/\bpath:\s*'([^']+)'/g)].map((x) => x[1]);
      if (segs.length) return segs;
    }
    m = /^(\w+)(?:\[[^\]]*\]|\.\w+)$/.exec(expr);
    if (m && tabs[m[1]]?.length) return tabs[m[1]];
    if (/^[A-Za-z_][\w.]*$/.test(expr) && !(expr in own)) return ['{}']; // an id or name interpolated into a path
    return null;
  };
}

function render(arg, resolve) {
  const lit = /^(['"])(.*)\1$/s.exec(arg);
  if (lit) return [lit[2]];
  if (arg.startsWith('`') && arg.endsWith('`')) {
    let outs = [''];
    const body = arg.slice(1, -1);
    let i = 0, buf = '';
    const push = (alts) => {
      outs = outs.flatMap((o) => alts.map((a) => o + a)).slice(0, 4000);
    };
    while (i < body.length) {
      if (body[i] === '$' && body[i + 1] === '{') {
        push([buf]);
        buf = '';
        let d = 1, j = i + 2;
        for (; j < body.length && d > 0; j++) {
          if (body[j] === '{') d++;
          else if (body[j] === '}') d--;
        }
        const alts = resolve(body.slice(i + 2, j - 1));
        if (!alts) return null;
        push(alts);
        i = j;
      } else buf += body[i++];
    }
    push([buf]);
    return outs;
  }
  const alts = resolve(arg);
  return alts && alts.every((a) => a !== '{}') ? alts : null;
}

const norm = (p) => p.replace(/\?.*$/, '').replace(/^\/+|\/+$/g, '').replace(/\/{2,}/g, '/');

export function requestsOf(file) {
  const src = read(file);
  const resolve = resolver(file, src);
  const found = [];
  const unresolved = [];
  for (const m of src.matchAll(CALLS)) {
    if (/function\s+$/.test(src.slice(Math.max(0, m.index - 12), m.index))) continue; // the helper's own declaration
    const args = argsOf(src, m.index + m[0].length);
    const first = firstArg(args);
    const line = src.slice(0, m.index).split('\n').length;
    if (first === 'path') continue; // inside a wrapper: the parameter, not a literal
    let paths = render(first, resolve);
    if (paths && m[1] === 'fetchById') paths = paths.map((p) => `${p}/{}`);
    if (!paths) {
      unresolved.push(`${file}:${line}  ${first.slice(0, 80)}`);
      continue;
    }
    const options = args.slice(first.length); // only the options object says what the method is
    const method =
      m[1] !== 'apiFetch'
        ? 'GET'
        : (/method:\s*'(GET|POST|PUT|PATCH|DELETE)'/.exec(options)?.[1] ?? (/\bbody\b/.test(options) ? 'POST' : 'GET'));
    for (const p of paths) found.push({ method, path: norm(p), source: `${file}:${line}` });
  }
  return { found, unresolved };
}

/** Calls the reader cannot see (a path built by a helper function), added by hand per file. */
const EXTRA = {
  'server/attendance.ts': [
    { method: 'GET', path: 'academic/campaign/transaction/teach-meetings/{}/qr' },
    { method: 'POST', path: 'academic/campaign/transaction/teach-meetings/{}/qr' },
    { method: 'DELETE', path: 'academic/campaign/transaction/teach-meetings/{}/qr' },
  ],
};
/** Paths a file hands to a helper that the reader reports as unresolved on purpose (documented here). */
const KNOWN_UNRESOLVED = [/server\/attendance\.ts:\d+ {2}qrPath\(/];

export function extractUsage() {
  const areas = {};
  const unresolvedAll = [];
  for (const [area, files] of Object.entries(AREAS)) {
    const seen = new Map();
    for (const { file, readOnly } of files) {
      const { found, unresolved } = requestsOf(file);
      unresolvedAll.push(...unresolved.filter((u) => !KNOWN_UNRESOLVED.some((k) => k.test(u))));
      const all = [...found, ...(EXTRA[file] ?? []).map((e) => ({ ...e, source: `${file} (helper)` }))];
      for (const r of all) {
        if (readOnly && r.method !== 'GET') continue;
        const key = `${r.method} ${r.path}`;
        const entry = seen.get(key) ?? { method: r.method, path: r.path, sources: [] };
        if (!entry.sources.includes(r.source)) entry.sources.push(r.source);
        seen.set(key, entry);
      }
    }
    areas[area] = { requests: [...seen.values()].sort((a, b) => (a.path + a.method).localeCompare(b.path + b.method)), unresolved: [] };
  }
  return { usage: { areas }, unresolved: unresolvedAll };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { usage, unresolved } = extractUsage();
  if (unresolved.length) {
    console.error(`Cannot read these calls:\n${unresolved.join('\n')}`);
    process.exit(1);
  }
  process.stdout.write(`${JSON.stringify(usage, null, 2)}\n`);
}
