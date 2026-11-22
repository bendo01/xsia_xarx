import { Show } from 'solid-js';

import { formatNumber, t } from '../../i18n';
import type { Delta } from '../../lib/analytics';

/** A headline number with an optional change since the previous period (higher is better). */
export default function Kpi(props: { label: string; value: string; caption?: string; delta?: Delta | null; decimals?: number }) {
  const change = () => props.delta?.change ?? null;
  const fmt = (n: number) => formatNumber(Math.abs(n), { maximumFractionDigits: props.decimals ?? 0, minimumFractionDigits: props.decimals ?? 0 });
  return (
    <div class="min-w-0 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
      <p class="truncate text-xs font-medium uppercase text-muted-foreground-1">{props.label}</p>
      <p class="mt-1 text-2xl font-semibold text-foreground">{props.value}</p>
      <div class="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
        <Show when={props.caption}><span class="truncate text-muted-foreground-1">{props.caption}</span></Show>
        <Show when={change() !== null && change() !== 0}>
          <span
            class={['font-medium', (change() as number) > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400']}
            title={t('cd.sincePrevious')}
          >
            {(change() as number) > 0 ? '▲' : '▼'} {fmt(change() as number)}
            <Show when={props.delta?.pct !== null && props.delta?.pct !== undefined}> ({Math.abs(props.delta!.pct as number) > 999 ? '>999' : formatNumber(Math.abs(props.delta!.pct as number), { maximumFractionDigits: 1 })}%)</Show>
          </span>
        </Show>
      </div>
    </div>
  );
}
