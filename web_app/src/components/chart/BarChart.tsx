import { For, createMemo } from 'solid-js';

import { formatNumber } from '../../i18n';
import { barRows, niceScale, ticks } from '../../lib/chart';

const ROW_H = 26;
const PAD = { top: 8, right: 56, bottom: 22, left: 8 };
const W = 640;

/**
 * Horizontal bars in plain SVG: labels above their bar so long names never collide, a value at the end
 * of each bar, a light grid with a nice axis, and a visually hidden table for screen readers.
 */
export default function BarChart(props: { items: { name: string; value: number }[]; ariaLabel: string; limit?: number }) {
  const items = createMemo(() => props.items.slice(0, props.limit ?? 15));
  const rows = createMemo(() => barRows(items().map((i) => i.value), props.limit ?? 15));
  const scale = createMemo(() => niceScale(Math.max(0, ...items().map((i) => i.value))));
  const plotW = W - PAD.left - PAD.right;
  const H = () => PAD.top + items().length * ROW_H * 1.5 + PAD.bottom;
  const rowTop = (i: number) => PAD.top + i * ROW_H * 1.5;
  const barW = (v: number) => (scale().max > 0 ? (Math.max(0, v) / scale().max) * plotW : 0);

  return (
    <div class="w-full min-w-0">
      <svg viewBox={`0 0 ${W} ${H()}`} class="h-auto w-full" role="img" aria-label={props.ariaLabel}>
        <title>{props.ariaLabel}</title>
        <For each={ticks(0, scale().max, scale().step)}>
          {(v) => (
            <g>
              <line x1={PAD.left + (v / (scale().max || 1)) * plotW} x2={PAD.left + (v / (scale().max || 1)) * plotW} y1={PAD.top} y2={H() - PAD.bottom} class="stroke-border" stroke-dasharray="3 3" />
              <text x={PAD.left + (v / (scale().max || 1)) * plotW} y={H() - 6} text-anchor="middle" class="fill-muted-foreground-1 text-[11px]">{formatNumber(v)}</text>
            </g>
          )}
        </For>
        <For each={rows()}>
          {(r) => (
            <g>
              <text x={PAD.left} y={rowTop(r.index) + 11} class="fill-foreground text-[12px]">{items()[r.index].name.length > 60 ? `${items()[r.index].name.slice(0, 59)}…` : items()[r.index].name}</text>
              <rect x={PAD.left} y={rowTop(r.index) + 16} width={Math.max(r.value > 0 ? 2 : 0, barW(r.value))} height="12" rx="2" fill="#6366f1">
                <title>{`${items()[r.index].name}: ${formatNumber(r.value)}`}</title>
              </rect>
              <text x={PAD.left + Math.max(r.value > 0 ? 2 : 0, barW(r.value)) + 6} y={rowTop(r.index) + 26} class="fill-muted-foreground-1 text-[11px]">{formatNumber(r.value)}</text>
            </g>
          )}
        </For>
      </svg>
      <table class="sr-only">
        <caption>{props.ariaLabel}</caption>
        <tbody>
          <For each={items()}>{(i) => <tr><th scope="row">{i.name}</th><td>{formatNumber(i.value)}</td></tr>}</For>
        </tbody>
      </table>
    </div>
  );
}
