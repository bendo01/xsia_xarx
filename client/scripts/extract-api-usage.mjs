#!/usr/bin/env node
// Traces every page under src/routes/<area>/ through its imports down to the fetch() calls it can trigger,
// and prints the API requests (method + path) each area makes as JSON.
//
// Tracing is per top-level declaration: a page importing `listStudents` from a controller only pulls in
// the requests made by `listStudents` (and the local helpers it calls), not every function in that file.
//
// Usage: node scripts/extract-api-usage.mjs > ../server/client_api_usage.json
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ts = require('typescript');

const CLIENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = path.join(CLIENT_DIR, 'src');
const ROUTES_DIR = path.join(SRC_DIR, 'routes');
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);

const rel = (file) => path.relative(CLIENT_DIR, file);

function listSourceFiles(dir) {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...listSourceFiles(full));
        else if (EXTENSIONS.includes(path.extname(entry.name)) && !/\.(test|spec)\.[jt]sx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
    }
    return out;
}

function resolveModule(fromFile, specifier) {
    let base;
    if (specifier.startsWith('~/')) base = path.join(SRC_DIR, specifier.slice(2));
    else if (specifier.startsWith('.')) base = path.resolve(path.dirname(fromFile), specifier);
    else return null; // package import
    const candidates = [base, ...EXTENSIONS.map((e) => base + e), ...EXTENSIONS.map((e) => path.join(base, 'index' + e))];
    return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

// ── URL rendering ────────────────────────────────────────────────────────────

// Parameter of the enclosing helper; replaced by the caller's argument, e.g. masterApiShow('academic/...', id)
const paramMarker = (i) => `{@${i}}`;
const MAX_ALTERNATIVES = 16;

// Render a URL expression into its possible path patterns; every unknown interpolation becomes "{}".
// Returns [] when the expression cannot be rendered at all.
function renderUrls(node, ctx, depth = 0) {
    if (!node || depth > 6) return [];
    const { scope, params } = ctx;
    if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isNonNullExpression(node)) return renderUrls(node.expression, ctx, depth);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text];
    if (ts.isConditionalExpression(node)) return [...renderUrls(node.whenTrue, ctx, depth + 1), ...renderUrls(node.whenFalse, ctx, depth + 1)];
    if (ts.isTemplateExpression(node)) {
        let outs = [node.head.text];
        for (const span of node.templateSpans) {
            let parts = renderUrls(span.expression, ctx, depth + 1);
            // Inline only path fragments and helper parameters; a lone id like `${id}` stays a wildcard
            parts = parts.filter((x) => x.includes('/') || x.includes('{@'));
            if (!parts.length) parts = ['{}'];
            outs = outs.flatMap((o) => parts.map((x) => o + x + span.literal.text)).slice(0, MAX_ALTERNATIVES);
        }
        return outs;
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const left = renderUrls(node.left, ctx, depth + 1);
        const right = renderUrls(node.right, ctx, depth + 1);
        return (left.length ? left : ['{}']).flatMap((l) => (right.length ? right : ['{}']).map((r) => l + r)).slice(0, MAX_ALTERNATIVES);
    }
    if (ts.isIdentifier(node)) {
        if (scope.has(node.text)) return renderUrls(scope.get(node.text), ctx, depth + 1);
        if (params.has(node.text)) return [paramMarker(params.get(node.text))];
        return [];
    }
    if (ts.isNewExpression(node) && node.expression.getText() === 'URL' && node.arguments?.length) return renderUrls(node.arguments[0], ctx, depth + 1);
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
        // url.toString(), apiPath.replace(/^\/+/, '') keep the shape of the receiver
        if (['toString', 'replace', 'trim'].includes(node.expression.name.text)) return renderUrls(node.expression.expression, ctx, depth + 1);
    }
    return [];
}

function normalizePath(rendered) {
    let p = rendered.split('?')[0].split('#')[0];
    p = p.replace(/^(\{\})+/, ''); // base URL prefix
    p = p.replace(/^https?:\/\/[^/]+/, '').replace(/^\/?api\/v1/, '');
    p = p.replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '');
    // A segment that mixes text and interpolation is treated as a wildcard
    p = p.split('/').map((s) => (s.includes('{}') ? '{}' : s)).join('/');
    return p;
}

function methodOf(optionsNode, scope) {
    let node = optionsNode;
    if (node && ts.isIdentifier(node)) node = scope.get(node.text);
    if (!node) return 'GET';
    if (!ts.isObjectLiteralExpression(node)) return null;
    for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop) && prop.name.getText().replace(/['"]/g, '') === 'method') {
            const v = prop.initializer;
            if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) return v.text.toUpperCase();
            return null;
        }
        if (ts.isShorthandPropertyAssignment(prop) && prop.name.text === 'method') return null;
    }
    return 'GET';
}

// ── Module analysis ──────────────────────────────────────────────────────────

const modules = new Map(); // file -> { imports, decls, reexports, starExports }

function analyze(file) {
    if (modules.has(file)) return modules.get(file);
    const text = fs.readFileSync(file, 'utf8');
    const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);

    const imports = new Map(); // local name -> { file, name }
    const decls = new Map(); // name -> { nodes: [], refs: Set, requests: [], unresolved: [], dynamicImports: [] }
    const reexports = new Map(); // exported name -> { file, name }
    const starExports = [];
    const mod = { file, imports, decls, reexports, starExports };
    modules.set(file, mod);

    const addDecl = (name, node) => {
        if (!decls.has(name)) decls.set(name, { nodes: [] });
        decls.get(name).nodes.push(node);
    };
    const MODULE = '<module>'; // non-declaration top-level statements; always reached with the file

    for (const stmt of sf.statements) {
        if (ts.isImportDeclaration(stmt)) {
            const target = resolveModule(file, stmt.moduleSpecifier.text);
            const clause = stmt.importClause;
            if (!target || !clause || clause.isTypeOnly) continue;
            if (clause.name) imports.set(clause.name.text, { file: target, name: 'default' });
            const nb = clause.namedBindings;
            if (nb && ts.isNamespaceImport(nb)) imports.set(nb.name.text, { file: target, name: '*' });
            if (nb && ts.isNamedImports(nb)) {
                for (const el of nb.elements) {
                    if (el.isTypeOnly) continue;
                    imports.set(el.name.text, { file: target, name: (el.propertyName ?? el.name).text });
                }
            }
            continue;
        }
        if (ts.isExportDeclaration(stmt)) {
            if (stmt.isTypeOnly) continue;
            const target = stmt.moduleSpecifier ? resolveModule(file, stmt.moduleSpecifier.text) : null;
            if (stmt.moduleSpecifier && !target) continue;
            if (!stmt.exportClause) {
                if (target) starExports.push(target);
            } else if (ts.isNamedExports(stmt.exportClause)) {
                for (const el of stmt.exportClause.elements) {
                    const exported = el.name.text;
                    const local = (el.propertyName ?? el.name).text;
                    if (target) reexports.set(exported, { file: target, name: local });
                    else if (exported !== local) reexports.set(exported, { file, name: local });
                }
            }
            continue;
        }
        if (ts.isExportAssignment(stmt)) {
            addDecl('default', stmt);
            continue;
        }
        const isDefault = stmt.modifiers?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword);
        if ((ts.isFunctionDeclaration(stmt) || ts.isClassDeclaration(stmt)) && (stmt.name || isDefault)) {
            if (stmt.name) addDecl(stmt.name.text, stmt);
            if (isDefault) addDecl('default', stmt);
            continue;
        }
        if (ts.isVariableStatement(stmt)) {
            for (const d of stmt.declarationList.declarations) {
                if (ts.isIdentifier(d.name)) addDecl(d.name.text, d);
                else addDecl(MODULE, d);
            }
            continue;
        }
        if (ts.isInterfaceDeclaration(stmt) || ts.isTypeAliasDeclaration(stmt)) continue;
        if (ts.isEnumDeclaration(stmt)) {
            addDecl(stmt.name.text, stmt);
            continue;
        }
        addDecl(MODULE, stmt);
    }

    const localNames = new Set(decls.keys());
    const fileScope = new Map();
    for (const [n, d] of decls) for (const dn of d.nodes) if (ts.isVariableDeclaration(dn) && dn.initializer) fileScope.set(n, dn.initializer);

    for (const [name, decl] of decls) {
        decl.refs = new Set();
        decl.fetches = []; // { method, urls: [pattern with optional {@i} markers], where }
        decl.calls = []; // { callee: local name, args: [[pattern]], where }
        decl.unresolved = [];
        decl.dynamicImports = [];
        for (const root of decl.nodes) {
            // Variables visible to fetch() calls: every `const x = ...` in the declaration plus file-level constants
            const scope = new Map(fileScope);
            const collectScope = (n) => {
                if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) scope.set(n.name.text, n.initializer);
                ts.forEachChild(n, collectScope);
            };
            collectScope(root);
            // Parameters of the declared function become markers so callers can fill them in
            const params = new Map();
            const fn = ts.isVariableDeclaration(root) ? root.initializer : root;
            if (fn && (ts.isFunctionDeclaration(fn) || ts.isArrowFunction(fn) || ts.isFunctionExpression(fn))) {
                fn.parameters.forEach((prm, i) => ts.isIdentifier(prm.name) && params.set(prm.name.text, i));
            }
            for (const prm of params.keys()) scope.delete(prm);
            const ctx = { scope, params };

            const visit = (n) => {
                if (ts.isIdentifier(n) && n.text !== name && (imports.has(n.text) || localNames.has(n.text))) decl.refs.add(n.text);
                if (ts.isCallExpression(n)) {
                    const where = `${rel(file)}:${sf.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
                    if (n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteralLike(n.arguments[0])) {
                        const target = resolveModule(file, n.arguments[0].text);
                        if (target) decl.dynamicImports.push(target);
                    }
                    const callee = n.expression;
                    const isFetch = (ts.isIdentifier(callee) && callee.text === 'fetch') ||
                        (ts.isPropertyAccessExpression(callee) && callee.name.text === 'fetch' && ['window', 'globalThis'].includes(callee.expression.getText()));
                    if (isFetch && n.arguments.length) {
                        const urls = renderUrls(n.arguments[0], ctx);
                        const method = methodOf(n.arguments[1], scope);
                        if (!urls.length || method === null || !HTTP_METHODS.has(method)) {
                            decl.unresolved.push({ where, expression: n.getText().slice(0, 160) });
                        } else {
                            decl.fetches.push({ method, urls, where });
                        }
                    } else if (ts.isIdentifier(callee) && callee.text !== name && (imports.has(callee.text) || localNames.has(callee.text))) {
                        decl.calls.push({ callee: callee.text, args: n.arguments.map((a) => renderUrls(a, ctx)), where });
                    }
                }
                ts.forEachChild(n, visit);
            };
            visit(root);
        }
    }
    return mod;
}

// Follow imports / re-exports to the module + declaration that defines `name`
function resolveExport(file, name, depth = 0) {
    if (depth > 10) return null;
    const mod = analyze(file);
    if (mod.decls.has(name)) return { mod, name };
    if (mod.reexports.has(name)) {
        const t = mod.reexports.get(name);
        return resolveExport(t.file, t.name, depth + 1);
    }
    for (const t of mod.starExports) {
        const r = resolveExport(t, name, depth + 1);
        if (r) return r;
    }
    return null;
}

function resolveLocal(mod, localName) {
    if (mod.decls.has(localName)) return { mod, name: localName };
    const imp = mod.imports.get(localName);
    return imp && imp.name !== '*' ? resolveExport(imp.file, imp.name) : null;
}

const isTemplate = (url) => url.includes('{@');

// Requests a declaration makes, as { method, url, where }; urls may still contain {@i} markers for its own params
const requestCache = new Map();
function requestsOf(mod, name) {
    const key = `${mod.file}#${name}`;
    if (requestCache.has(key)) return requestCache.get(key);
    requestCache.set(key, []); // recursion guard
    const decl = mod.decls.get(name);
    const out = [];
    for (const f of decl.fetches) for (const url of f.urls) out.push({ method: f.method, url, where: f.where });
    for (const call of decl.calls) {
        const target = resolveLocal(mod, call.callee);
        if (!target) continue;
        for (const r of requestsOf(target.mod, target.name)) {
            if (!isTemplate(r.url)) continue; // concrete requests are counted when the callee itself is reached
            let urls = [r.url];
            for (const m of r.url.matchAll(/\{@(\d+)\}/g)) {
                const alts = call.args[Number(m[1])] ?? [];
                const fill = alts.length ? alts : ['{}'];
                urls = urls.flatMap((u) => fill.map((a) => u.split(m[0]).join(a))).slice(0, MAX_ALTERNATIVES);
            }
            for (const url of urls) out.push({ method: r.method, url, where: `${call.where} -> ${r.where}` });
        }
    }
    requestCache.set(key, out);
    return out;
}

// ── Reachability per area ────────────────────────────────────────────────────

function collectArea(rootFiles) {
    const requests = new Map(); // "METHOD path" -> { method, path, sources: Set }
    const unresolved = new Map();
    const seen = new Set();
    const queue = [];
    const push = (file, name) => {
        const key = `${file}#${name}`;
        if (!seen.has(key)) {
            seen.add(key);
            queue.push([file, name]);
        }
    };
    for (const f of rootFiles) push(f, '*');

    while (queue.length) {
        const [file, name] = queue.shift();
        const mod = analyze(file);
        let names;
        if (name === '*') {
            names = [...mod.decls.keys()];
            for (const [, target] of mod.reexports) push(target.file, target.name);
            for (const target of mod.starExports) push(target, '*');
        } else if (mod.decls.has(name)) {
            names = [name];
        } else if (mod.reexports.has(name)) {
            const t = mod.reexports.get(name);
            push(t.file, t.name);
            names = [];
        } else {
            for (const target of mod.starExports) push(target, name);
            names = [];
        }
        if (name !== '*' && mod.decls.has('<module>')) names.push('<module>');

        for (const n of names) {
            const decl = mod.decls.get(n);
            if (!decl) continue;
            for (const r of requestsOf(mod, n)) {
                // Templates are resolved at their call sites; only concrete paths are kept
                if (isTemplate(r.url)) continue;
                const p = normalizePath(r.url);
                if (!p || p.split('/')[0] === '{}') {
                    unresolved.set(r.where, { where: r.where, expression: `${r.method} ${r.url}` });
                    continue;
                }
                const key = `${r.method} ${p}`;
                if (!requests.has(key)) requests.set(key, { method: r.method, path: p, sources: new Set() });
                requests.get(key).sources.add(r.where);
            }
            for (const u of decl.unresolved) unresolved.set(u.where, u);
            for (const t of decl.dynamicImports) push(t, '*');
            for (const ref of decl.refs) {
                if (mod.decls.has(ref)) push(file, ref);
                else if (mod.imports.has(ref)) {
                    const imp = mod.imports.get(ref);
                    push(imp.file, imp.name);
                }
            }
        }
    }

    return {
        pages: rootFiles.map(rel).sort(),
        requests: [...requests.values()]
            .map((r) => ({ method: r.method, path: r.path, sources: [...r.sources].sort() }))
            .sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method)),
        unresolved: [...unresolved.values()].sort((a, b) => a.where.localeCompare(b.where)),
    };
}

const areas = {};
for (const entry of fs.readdirSync(ROUTES_DIR, { withFileTypes: true })) {
    if (entry.isDirectory()) areas[entry.name] = listSourceFiles(path.join(ROUTES_DIR, entry.name));
}
// The root layout and pages outside an area folder (/, /404) are reachable by everyone
areas['_shared'] = [
    path.join(SRC_DIR, 'app.tsx'),
    ...fs.readdirSync(ROUTES_DIR, { withFileTypes: true })
        .filter((e) => e.isFile() && EXTENSIONS.includes(path.extname(e.name)) && !/\.(test|spec)\./.test(e.name))
        .map((e) => path.join(ROUTES_DIR, e.name)),
];

const result = { generated_at: new Date().toISOString(), areas: {} };
for (const [area, files] of Object.entries(areas).sort()) result.areas[area] = collectArea(files);

process.stdout.write(JSON.stringify(result, null, 2) + '\n');
