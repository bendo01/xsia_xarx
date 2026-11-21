import { For } from 'solid-js';

import { formatNumber } from '../../i18n';

/** Horizontal bars as a plain list: readable on any width, themed by tokens, no library. */
export default function BarList(props: { items: { name: string; value: number }[]; limit?: number; ariaLabel: string }) {
  const shown = () => props.items.slice(0, props.limit ?? 12);
  const max = () => Math.max(1, ...shown().map((i) => i.value));
  return (
    <ul class="space-y-2" aria-label={props.ariaLabel}>
      <For each={shown()}>
        {(i) => (
          <li class="grid grid-cols-[minmax(0,40%)_1fr_auto] items-center gap-3 text-sm">
            <span class="truncate" title={i.name}>{i.name}</span>
            <span class="h-2 overflow-hidden rounded-xs bg-muted" aria-hidden="true">
              <span class="block h-full bg-primary" style={{ width: `${Math.max(2, (i.value / max()) * 100)}%` }} />
            </span>
            <span class="font-mono text-xs text-muted-foreground-1">{formatNumber(i.value)}</span>
          </li>
        )}
      </For>
    </ul>
  );
}
