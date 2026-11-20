import { For, Show, createMemo, createSignal } from 'solid-js';

import { areaPath, labelIndexes, linePath, niceScale, ticks, xAt, yAt } from '../../lib/chart';

export interface ChartSeries {
  name: string;
  color: string;
  values: number[];
  /** Fill the area under the line. */
  area?: boolean;
}

const W = 640;
const PAD = { top: 16, right: 20, bottom: 28, left: 40 };

/**
 * A small responsive line chart in plain SVG: rendered on the server, themed by
 * design tokens (so dark mode follows), with a hover/focus tooltip and a hidden
 * data table for screen readers. No charting library.
 */
export default function LineChart(props: {
  categories: string[];
  series: ChartSeries[];
  /** Axis maximum; omit to fit the data. Minimum is always 0. */
  yMax?: number;
  yStep?: number;
  format?: (n: number) => string;
  ariaLabel: string;
  height?: number;
}) {
  const H = () => props.height ?? 220;
  const bottom = () => H() - PAD.bottom;
  const n = () => props.categories.length;
  const fmt = (v: number) => (props.format ? props.format(v) : String(v));

  const scale = createMemo(() => {
    if (props.yMax != null) return { max: props.yMax, step: props.yStep ?? 1 };
    const top = Math.max(0, ...props.series.flatMap((s) => s.values));
    return niceScale(top);
  });

  const lines = createMemo(() =>
    props.series.map((s) => ({
      ...s,
      points: s.values.map((v, i) => ({ x: xAt(i, n(), PAD.left, W - PAD.right), y: yAt(v, 0, scale().max, PAD.top, bottom()) })),
    })),
  );

  const [hover, setHover] = createSignal<number | null>(null);
  const colW = () => (n() <= 1 ? W - PAD.left - PAD.right : (W - PAD.left - PAD.right) / (n() - 1));

  // Tooltip box, clamped inside the plot.
  const tip = createMemo(() => {
    const i = hover();
    if (i === null) return null;
    const rows = props.series.map((s) => ({ color: s.color, text: `${s.name}: ${fmt(s.values[i] ?? 0)}` }));
    const title = props.categories[i] ?? '';
    const chars = Math.max(title.length, ...rows.map((r) => r.text.length));
    const w = Math.min(W - 8, chars * 6.4 + 34);
    const h = 22 + rows.length * 16;
    const cx = xAt(i, n(), PAD.left, W - PAD.right);
    const x = Math.min(Math.max(cx - w / 2, 4), W - w - 4);
    return { i, title, rows, w, h, x, y: PAD.top, cx };
  });

  return (
    <div class="w-full min-w-0">
      <svg viewBox={`0 0 ${W} ${H()}`} class="h-auto w-full" role="img" aria-label={props.ariaLabel} onPointerLeave={() => setHover(null)}>
        <title>{props.ariaLabel}</title>

        {/* y grid + labels */}
        <For each={ticks(0, scale().max, scale().step)}>
          {(v) => (
            <g>
              <line x1={PAD.left} x2={W - PAD.right} y1={yAt(v, 0, scale().max, PAD.top, bottom())} y2={yAt(v, 0, scale().max, PAD.top, bottom())} class="stroke-border" stroke-dasharray="3 3" />
              <text x={PAD.left - 8} y={yAt(v, 0, scale().max, PAD.top, bottom()) + 4} text-anchor="end" class="fill-muted-foreground-1 text-[11px]">{fmt(v)}</text>
            </g>
          )}
        </For>

        {/* x labels */}
        <For each={labelIndexes(n())}>
          {(i) => (
            <text x={xAt(i, n(), PAD.left, W - PAD.right)} y={H() - 8} text-anchor="middle" class="fill-muted-foreground-1 text-[11px]">{props.categories[i]}</text>
          )}
        </For>

        <For each={lines()}>
          {(s) => (
            <g>
              <Show when={s.area}>
                <path d={areaPath(s.points, bottom())} fill={s.color} fill-opacity="0.12" />
              </Show>
              <path d={linePath(s.points)} fill="none" stroke={s.color} stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />
              <For each={s.points}>{(p) => <circle cx={p.x} cy={p.y} r="3.5" fill={s.color} class="stroke-card" stroke-width="1.5" />}</For>
            </g>
          )}
        </For>

        {/* hover columns */}
        <For each={props.categories}>
          {(_, i) => (
            <rect
              x={xAt(i(), n(), PAD.left, W - PAD.right) - colW() / 2}
              y={PAD.top}
              width={colW()}
              height={bottom() - PAD.top}
              fill="transparent"
              onPointerEnter={() => setHover(i())}
            />
          )}
        </For>

        <Show when={tip()}>
          {(t) => (
            <g pointer-events="none">
              <line x1={t().cx} x2={t().cx} y1={PAD.top} y2={bottom()} class="stroke-muted-foreground-1" stroke-opacity="0.4" />
              <rect x={t().x} y={t().y} width={t().w} height={t().h} rx="2" class="fill-popover stroke-border" />
              <text x={t().x + 10} y={t().y + 16} class="fill-foreground text-[11px] font-semibold">{t().title}</text>
              <For each={t().rows}>
                {(r, k) => (
                  <g>
                    <circle cx={t().x + 14} cy={t().y + 30 + k() * 16} r="3.5" fill={r.color} />
                    <text x={t().x + 24} y={t().y + 34 + k() * 16} class="fill-foreground text-[11px]">{r.text}</text>
                  </g>
                )}
              </For>
            </g>
          )}
        </Show>
      </svg>

      <ul class="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-foreground" aria-hidden="true">
        <For each={props.series}>
          {(s) => (
            <li class="flex items-center gap-1.5">
              <span class="size-2.5 rounded-full" style={{ 'background-color': s.color }} />
              {s.name}
            </li>
          )}
        </For>
      </ul>

      {/* The same numbers as text, for screen readers. */}
      <table class="sr-only">
        <caption>{props.ariaLabel}</caption>
        <thead>
          <tr><th scope="col" />
            <For each={props.series}>{(s) => <th scope="col">{s.name}</th>}</For>
          </tr>
        </thead>
        <tbody>
          <For each={props.categories}>
            {(c, i) => (
              <tr>
                <th scope="row">{c}</th>
                <For each={props.series}>{(s) => <td>{fmt(s.values[i()] ?? 0)}</td>}</For>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
