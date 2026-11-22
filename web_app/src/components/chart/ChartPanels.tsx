import { Show } from 'solid-js';
import type { JSX } from '@solidjs/web';

import { formatNumber } from '../../i18n';
import { seriesSpec, slicesSpec } from '../../lib/chart-specs';
import type { LineData, Slice } from '../../lib/unit-dashboard';
import ChartJs from './ChartJs';

/** A titled card around one chart. */
export function ChartCard(props: { title: string; hint?: string; wide?: boolean; children: JSX.Element }) {
  return (
    <section class={['min-w-0 rounded-xs border border-card-line bg-card p-5 shadow-2xs', { 'lg:col-span-2': props.wide }]}>
      <h2 class="font-semibold text-foreground">{props.title}</h2>
      <Show when={props.hint}><p class="mb-3 mt-0.5 text-xs text-muted-foreground-1">{props.hint}</p></Show>
      <div class={props.hint ? '' : 'mt-3'}>{props.children}</div>
    </section>
  );
}

/** A period series: stacked bars for counts, a line for rates. Renders nothing without data. */
export function TrendCard(props: { title: string; hint?: string; line: LineData | null; kind?: 'bar' | 'line'; yMax?: number; decimals?: number; wide?: boolean }) {
  return (
    <Show when={props.line}>
      {(l) => (
        <ChartCard title={props.title} hint={props.hint} wide={props.wide}>
          <ChartJs
            ariaLabel={props.title}
            spec={seriesSpec(l(), props.kind ?? 'bar', {
              stacked: (props.kind ?? 'bar') === 'bar',
              gapZeros: props.kind === 'line',
              yMax: props.yMax,
              precision: props.decimals ?? 0,
              format: (n) => formatNumber(n, { maximumFractionDigits: props.decimals ?? 0, minimumFractionDigits: props.decimals ?? 0 }),
            })}
          />
        </ChartCard>
      )}
    </Show>
  );
}

/** Name / value rows as a doughnut (parts of a whole) or horizontal bars (a ranking). Hidden when empty. */
export function RankCard(props: { title: string; hint?: string; items: Slice[]; kind?: 'doughnut' | 'bar'; yMax?: number; decimals?: number; limit?: number }) {
  const kind = () => props.kind ?? 'doughnut';
  const rows = () => props.items.slice(0, props.limit ?? 12);
  return (
    <Show when={props.items.length > 0}>
      <ChartCard title={props.title} hint={props.hint}>
        <ChartJs
          ariaLabel={props.title}
          height={kind() === 'bar' ? Math.min(460, 60 + rows().length * 28) : 240}
          spec={slicesSpec(props.items, kind(), {
            limit: props.limit,
            yMax: props.yMax,
            precision: props.decimals ?? 0,
            label: props.title,
            format: (n) => formatNumber(n, { maximumFractionDigits: props.decimals ?? 0, minimumFractionDigits: props.decimals ?? 0 }),
          })}
        />
      </ChartCard>
    </Show>
  );
}
