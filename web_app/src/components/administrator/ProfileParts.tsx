import type { JSX } from '@solidjs/web';
import { For } from 'solid-js';

/** "–" for an empty value, a tick for true, the text otherwise. */
export const mark = (v: unknown) => (v === true ? '✓' : v === false ? '–' : v === null || v === undefined || v === '' ? '–' : String(v));

export const errorBox = 'rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive';

/** A titled block of a profile page; it stays in one piece when printed. */
export function Card(props: { title: string; children: JSX.Element }) {
  return (
    <section class="min-w-0 rounded-xs border border-card-line bg-card p-4 shadow-2xs print:break-inside-avoid">
      <h2 class="mb-3 text-sm font-semibold uppercase text-muted-foreground-1">{props.title}</h2>
      {props.children}
    </section>
  );
}

/** Label/value pairs as a definition list. */
export function Fields(props: { rows: [label: string, value: unknown][] }) {
  return (
    <dl class="grid grid-cols-[minmax(0,40%)_1fr] gap-x-3 gap-y-1.5 text-sm">
      <For each={props.rows}>{([label, value]) => <><dt class="text-muted-foreground-1">{label}</dt><dd class="min-w-0 break-words font-medium">{typeof value === 'object' && value !== null ? (value as JSX.Element) : mark(value)}</dd></>}</For>
    </dl>
  );
}
