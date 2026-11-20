import { Check } from '@lucide/solid';
import { Checkbox as KCheckbox } from '@kobalte/core/checkbox';
import { Show } from 'solid-js';
import { cn } from '../../lib/utils';

export function Checkbox(p: { checked?: boolean; onChange?: (v: boolean) => void; label?: string; disabled?: boolean; class?: string }) {
  return (
    <KCheckbox checked={p.checked} onChange={p.onChange} disabled={p.disabled} class={cn('inline-flex items-center gap-2', p.class)}>
      <KCheckbox.Input />
      <KCheckbox.Control class="flex size-4 items-center justify-center rounded-xs border border-input bg-card transition-colors data-[checked]:border-primary data-[checked]:bg-primary data-[disabled]:opacity-50">
        <KCheckbox.Indicator class="text-primary-foreground">
          <Check class="size-3" stroke-width={2.5} />
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      <Show when={p.label}>
        <KCheckbox.Label class="text-sm">{p.label}</KCheckbox.Label>
      </Show>
    </KCheckbox>
  );
}
