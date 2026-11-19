import { createSignal, For, type JSX, Match, Show, Switch } from 'solid-js';

/**
 * Small dependency-free markdown renderer that outputs Solid elements
 * (never raw HTML, so model output cannot inject markup).
 * Supports: fenced code, tables, headings, lists, blockquotes, hr,
 * bold/italic/strike, inline code, links and `[n]` citation markers.
 */

type Block =
    | { type: 'code'; lang: string; text: string }
    | { type: 'heading'; level: number; text: string }
    | { type: 'table'; head: string[]; align: ('left' | 'center' | 'right')[]; rows: string[][] }
    | { type: 'list'; ordered: boolean; items: string[] }
    | { type: 'quote'; text: string }
    | { type: 'hr' }
    | { type: 'para'; text: string };

const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l) && l.includes('-');
const splitRow = (l: string) => {
    let s = l.trim();
    if (s.startsWith('|')) s = s.slice(1);
    if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
    return s.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
};
const isRow = (l: string) => l.includes('|') && l.trim().length > 0;

export function parseBlocks(src: string): Block[] {
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    const out: Block[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        const fence = /^\s*(```+|~~~+)\s*([\w+-]*)/.exec(line);
        if (fence) {
            const buf: string[] = [];
            i++;
            while (i < lines.length && !lines[i].trim().startsWith(fence[1])) buf.push(lines[i++]);
            i++; // closing fence (or EOF while streaming)
            out.push({ type: 'code', lang: fence[2].toLowerCase(), text: buf.join('\n') });
            continue;
        }
        if (!line.trim()) {
            i++;
            continue;
        }
        const h = /^(#{1,6})\s+(.*)$/.exec(line);
        if (h) {
            out.push({ type: 'heading', level: h[1].length, text: h[2].replace(/\s*#+\s*$/, '') });
            i++;
            continue;
        }
        if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
            out.push({ type: 'hr' });
            i++;
            continue;
        }
        if (isRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const head = splitRow(line);
            const align = splitRow(lines[i + 1]).map((c) =>
                c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left',
            ) as ('left' | 'center' | 'right')[];
            i += 2;
            const rows: string[][] = [];
            while (i < lines.length && isRow(lines[i])) rows.push(splitRow(lines[i++]));
            out.push({ type: 'table', head, align, rows });
            continue;
        }
        if (/^\s*>/.test(line)) {
            const buf: string[] = [];
            while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
            out.push({ type: 'quote', text: buf.join('\n') });
            continue;
        }
        const li = /^\s*([-*+]|\d+[.)])\s+/.exec(line);
        if (li) {
            const ordered = /\d/.test(li[1]);
            const items: string[] = [];
            while (i < lines.length) {
                const m = /^\s*([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
                if (m && /\d/.test(m[1]) === ordered) {
                    items.push(m[2]);
                    i++;
                } else if (/^\s{2,}\S/.test(lines[i]) && items.length) {
                    items[items.length - 1] += ' ' + lines[i++].trim();
                } else break;
            }
            out.push({ type: 'list', ordered, items });
            continue;
        }
        const buf: string[] = [];
        while (
            i < lines.length &&
            lines[i].trim() &&
            !/^\s*(```|~~~|#{1,6}\s|>)/.test(lines[i]) &&
            !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
            !(isRow(lines[i]) && i + 1 < lines.length && isTableSep(lines[i + 1]))
        ) {
            buf.push(lines[i++]);
        }
        out.push({ type: 'para', text: buf.join('\n') });
    }
    return out;
}

const INLINE = /(`[^`\n]+`|\*\*[^*\n]+\*\*|__[^_\n]+__|~~[^~\n]+~~|\*[^*\s][^*\n]*\*|\[[^\]\n]+\]\((?:https?:\/\/|\/)[^)\s]+\)|\[\d+\])/g;

function Inline(props: { text: string; onCite?: (n: number) => void }): JSX.Element {
    const parts = () => props.text.split(INLINE).filter((s) => s.length > 0);
    return (
        <For each={parts()}>
            {(p) => {
                let m: RegExpExecArray | null;
                if ((m = /^`([^`]+)`$/.exec(p))) {
                    return (
                        <code class="px-1 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-[0.85em] font-mono text-pink-700 dark:text-pink-300">
                            {m[1]}
                        </code>
                    );
                }
                if ((m = /^(?:\*\*|__)(.+)(?:\*\*|__)$/.exec(p))) {
                    return (
                        <strong class="font-semibold">
                            <Inline text={m[1]} onCite={props.onCite} />
                        </strong>
                    );
                }
                if ((m = /^~~(.+)~~$/.exec(p))) return <del>{m[1]}</del>;
                if ((m = /^\*(.+)\*$/.exec(p))) {
                    return (
                        <em>
                            <Inline text={m[1]} onCite={props.onCite} />
                        </em>
                    );
                }
                if ((m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(p))) {
                    return (
                        <a
                            href={m[2]}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-blue-600 dark:text-blue-400 underline underline-offset-2"
                        >
                            {m[1]}
                        </a>
                    );
                }
                if ((m = /^\[(\d+)\]$/.exec(p)) && props.onCite) {
                    const n = Number(m[1]);
                    return (
                        <button
                            type="button"
                            onClick={() => props.onCite?.(n)}
                            class="mx-0.5 px-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-md cursor-pointer"
                        >
                            {p}
                        </button>
                    );
                }
                return <>{p}</>;
            }}
        </For>
    );
}

const LANG_LABEL: Record<string, string> = {
    sh: 'shell',
    bash: 'shell',
    shell: 'shell',
    zsh: 'shell',
    console: 'shell',
};

function CodeBlock(props: { lang: string; text: string }) {
    const [copied, setCopied] = createSignal(false);
    const isShell = () => LANG_LABEL[props.lang] === 'shell';
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(props.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable */
        }
    };
    return (
        <div class="my-2 rounded-md overflow-hidden border border-neutral-300 dark:border-neutral-700 bg-neutral-900 text-neutral-100">
            <div class="flex items-center justify-between px-3 py-1 text-xs bg-neutral-800 text-neutral-400">
                <span class="font-mono">{LANG_LABEL[props.lang] ?? (props.lang || 'text')}</span>
                <button type="button" onClick={copy} class="hover:text-white cursor-pointer">
                    {copied() ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre class="p-3 overflow-x-auto text-[0.8rem] leading-relaxed font-mono whitespace-pre">
                <code>
                    <For each={props.text.split('\n')}>
                        {(l) => (
                            <div>
                                <Show when={isShell() && !l.startsWith('#')}>
                                    <span class="select-none text-green-400">$ </span>
                                </Show>
                                {l || ' '}
                            </div>
                        )}
                    </For>
                </code>
            </pre>
        </div>
    );
}

const HEADING = ['', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-sm', 'text-xs'];

export default function Markdown(props: { text: string; onCite?: (n: number) => void }) {
    const blocks = () => {
        // A fenced ```md block that holds a table/markdown is shown rendered
        return parseBlocks(props.text).flatMap((b) =>
            b.type === 'code' && (b.lang === 'md' || b.lang === 'markdown') ? parseBlocks(b.text) : [b],
        );
    };
    return (
        <div class="space-y-2 wrap-break-words">
            <For each={blocks()}>
                {(b) => (
                    <Switch>
                        <Match when={b.type === 'code' && (b as Extract<Block, { type: 'code' }>)}>
                            {(c) => <CodeBlock lang={c().lang} text={c().text} />}
                        </Match>
                        <Match when={b.type === 'heading' && (b as Extract<Block, { type: 'heading' }>)}>
                            {(h) => (
                                <p class={`font-semibold pt-1 ${HEADING[h().level]}`}>
                                    <Inline text={h().text} onCite={props.onCite} />
                                </p>
                            )}
                        </Match>
                        <Match when={b.type === 'table' && (b as Extract<Block, { type: 'table' }>)}>
                            {(t) => (
                                <div class="overflow-x-auto rounded-md border border-neutral-300 dark:border-neutral-700">
                                    <table class="min-w-full text-xs border-collapse">
                                        <thead class="bg-neutral-200 dark:bg-neutral-800">
                                            <tr>
                                                <For each={t().head}>
                                                    {(c, ci) => (
                                                        <th
                                                            class="px-3 py-2 font-semibold border-b border-neutral-300 dark:border-neutral-700 align-top"
                                                            style={{ 'text-align': t().align[ci()] ?? 'left' }}
                                                        >
                                                            <Inline text={c} onCite={props.onCite} />
                                                        </th>
                                                    )}
                                                </For>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <For each={t().rows}>
                                                {(r) => (
                                                    <tr class="odd:bg-transparent even:bg-neutral-200/50 dark:even:bg-neutral-800/50">
                                                        <For each={t().head.map((_, ci) => r[ci] ?? '')}>
                                                            {(c, ci) => (
                                                                <td
                                                                    class="px-3 py-2 align-top border-t border-neutral-300 dark:border-neutral-700"
                                                                    style={{ 'text-align': t().align[ci()] ?? 'left' }}
                                                                >
                                                                    <Inline text={c} onCite={props.onCite} />
                                                                </td>
                                                            )}
                                                        </For>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Match>
                        <Match when={b.type === 'list' && (b as Extract<Block, { type: 'list' }>)}>
                            {(l) => (
                                <Show
                                    when={l().ordered}
                                    fallback={
                                        <ul class="list-disc pl-5 space-y-0.5">
                                            <For each={l().items}>
                                                {(it) => (
                                                    <li>
                                                        <Inline text={it} onCite={props.onCite} />
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    }
                                >
                                    <ol class="list-decimal pl-5 space-y-0.5">
                                        <For each={l().items}>
                                            {(it) => (
                                                <li>
                                                    <Inline text={it} onCite={props.onCite} />
                                                </li>
                                            )}
                                        </For>
                                    </ol>
                                </Show>
                            )}
                        </Match>
                        <Match when={b.type === 'quote' && (b as Extract<Block, { type: 'quote' }>)}>
                            {(q) => (
                                <blockquote class="border-l-4 border-neutral-400 dark:border-neutral-600 pl-3 italic text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                                    <Inline text={q().text} onCite={props.onCite} />
                                </blockquote>
                            )}
                        </Match>
                        <Match when={b.type === 'hr'}>
                            <hr class="border-neutral-300 dark:border-neutral-700" />
                        </Match>
                        <Match when={b.type === 'para' && (b as Extract<Block, { type: 'para' }>)}>
                            {(p) => (
                                <p class="whitespace-pre-wrap">
                                    <Inline text={p().text} onCite={props.onCite} />
                                </p>
                            )}
                        </Match>
                    </Switch>
                )}
            </For>
        </div>
    );
}
