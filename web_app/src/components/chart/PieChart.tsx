import { For, Show, createMemo, createSignal } from 'solid-js';

import { formatNumber } from '../../i18n';
import { arcPath, pieSlices } from '../../lib/chart';

/** Same palette as the line charts; a ring that has more slices than colours cycles. */
export const CHART_COLORS = ['#6366f1', '#0ea5e9', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#84cc16', '#ec4899'];

const SIZE = 200;
const C = SIZE / 2;
const R1 = 90;
const R0 = 54;

/**
 * A donut chart in plain SVG: slices with a hover/focus highlight, the total in the middle, a legend
 * with values and shares, and the same numbers as a visually hidden table for screen readers.
 */
export default function PieChart(props: { items: { name: string; value: number }[]; ariaLabel: string; totalLabel?: string }) {
  const rows = createMemo(() => props.items.filter((i) => i.value > 0));
  const slices = createMemo(() => pieSlices(rows().map((r) => r.value)));
  const total = () => rows().reduce((s, r) => s + r.value, 0);
  const [active, setActive] = createSignal<number | null>(null);
  const color = (i: number) => CHART_COLORS[i % CHART_COLORS.length];
  const pct = (f: number) => `${formatNumber(Math.round(f * 1000) / 10)}%`;

  return (
    <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} class="size-44 shrink-0" role="img" aria-label={props.ariaLabel} onPointerLeave={() => setActive(null)}>
        <title>{props.ariaLabel}</title>
        <For each={slices()}>
          {(s) => (
            <path
              d={arcPath(C, C, R0, R1, s.start, s.end)}
              fill={color(s.index)}
              class="stroke-card transition-opacity"
              stroke-width="1.5"
              opacity={active() === null || active() === s.index ? 1 : 0.35}
              tabindex="0"
              onPointerEnter={() => setActive(s.index)}
              onFocus={() => setActive(s.index)}
              onBlur={() => setActive(null)}
            >
              <title>{`${rows()[s.index].name}: ${formatNumber(s.value)} (${pct(s.fraction)})`}</title>
            </path>
          )}
        </For>
        <text x={C} y={C - 2} text-anchor="middle" class="fill-foreground text-[22px] font-semibold">{formatNumber(total())}</text>
        <Show when={props.totalLabel}>
          <text x={C} y={C + 16} text-anchor="middle" class="fill-muted-foreground-1 text-[11px]">{props.totalLabel}</text>
        </Show>
      </svg>

      <ul class="min-w-0 flex-1 space-y-1.5 text-sm" aria-hidden="true">
        <For each={slices()}>
          {(s) => (
            <li class="flex items-center gap-2" onPointerEnter={() => setActive(s.index)} onPointerLeave={() => setActive(null)}>
              <span class="size-2.5 shrink-0 rounded-full" style={{ 'background-color': color(s.index) }} />
              <span class="min-w-0 flex-1 truncate" title={rows()[s.index].name}>{rows()[s.index].name}</span>
              <span class="font-mono text-xs text-muted-foreground-1">{formatNumber(s.value)} · {pct(s.fraction)}</span>
            </li>
          )}
        </For>
      </ul>

      <table class="sr-only">
        <caption>{props.ariaLabel}</caption>
        <tbody>
          <For each={slices()}>{(s) => <tr><th scope="row">{rows()[s.index].name}</th><td>{formatNumber(s.value)}</td></tr>}</For>
        </tbody>
      </table>
    </div>
  );
}
