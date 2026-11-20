import type { JSX } from '@solidjs/web';
import { Show } from 'solid-js';

export default function PageHeader(props: { title: string; description?: string; actions?: JSX.Element }) {
  return (
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-card-divider pb-4">
      <div class="min-w-0">
        <h1 class="text-2xl font-semibold tracking-tight text-foreground">{props.title}</h1>
        <Show when={props.description}>
          <p class="mt-1 max-w-2xl text-sm text-muted-foreground-1">{props.description}</p>
        </Show>
      </div>
      <Show when={props.actions}>
        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">{props.actions}</div>
      </Show>
    </div>
  );
}
