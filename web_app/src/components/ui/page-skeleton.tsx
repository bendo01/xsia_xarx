import { For } from 'solid-js';

import { t } from '../../i18n';
import type { SkeletonKind } from '../../lib/skeleton-kind';
import { Skeleton } from './skeleton';

const card = 'rounded-xs border border-card-line bg-card shadow-2xs';

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

/** Page title + subtitle placeholder. */
function Head() {
  return (
    <div class="space-y-2">
      <Skeleton class="h-7 w-56" />
      <Skeleton class="h-4 w-80 max-w-full" />
    </div>
  );
}

/**
 * What a page looks like before its data lands: the same blocks (title, KPI cards, charts / filter +
 * table / form fields) in the same places, so the content does not jump when it arrives.
 */
export default function PageSkeleton(props: { kind?: SkeletonKind }) {
  const kind = () => props.kind ?? 'list';
  return (
    <div role="status" aria-busy="true" aria-live="polite" class="space-y-6">
      <span class="sr-only">{t('common.loading')}</span>
      <Head />

      {kind() === 'dashboard' && (
        <>
          <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <For each={range(4)}>{() => <div class={`${card} space-y-3 p-4`}><Skeleton class="h-3 w-24" /><Skeleton class="h-8 w-20" /><Skeleton class="h-3 w-16" /></div>}</For>
          </div>
          <div class="grid gap-6 lg:grid-cols-2">
            <For each={range(4)}>{() => <div class={`${card} space-y-4 p-5`}><Skeleton class="h-4 w-48" /><Skeleton class="h-56 w-full" /></div>}</For>
          </div>
        </>
      )}

      {kind() === 'list' && (
        <>
          <div class="flex flex-wrap gap-2">
            <Skeleton class="h-9 w-64 max-w-full" />
            <Skeleton class="h-9 w-24" />
          </div>
          <div class={`${card} divide-y divide-card-divider`}>
            <div class="flex gap-4 p-3"><For each={range(5)}>{() => <Skeleton class="h-3 flex-1" />}</For></div>
            <For each={range(8)}>{() => <div class="flex items-center gap-4 p-3"><For each={range(5)}>{() => <Skeleton class="h-4 flex-1" />}</For></div>}</For>
          </div>
        </>
      )}

      {kind() === 'detail' && (
        <div class={`${card} space-y-5 p-5`}>
          <For each={range(5)}>{() => <div class="space-y-2"><Skeleton class="h-3 w-32" /><Skeleton class="h-9 w-full max-w-xl" /></div>}</For>
          <Skeleton class="h-9 w-28" />
        </div>
      )}
    </div>
  );
}
