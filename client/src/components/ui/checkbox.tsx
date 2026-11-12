import { Checkbox as KCheckbox } from "@kobalte/core/checkbox";
import { cn } from "~/lib/utils";

export function Checkbox(p: { checked?: boolean; onChange?: (v: boolean) => void; label?: string; disabled?: boolean; class?: string }) {
  return (
    <KCheckbox checked={p.checked} onChange={p.onChange} disabled={p.disabled} class={cn("inline-flex items-center gap-2", p.class)}>
      <KCheckbox.Input />
      <KCheckbox.Control class="flex size-4 items-center justify-center rounded border border-input bg-card transition-colors data-[checked]:border-primary data-[checked]:bg-primary data-[disabled]:opacity-50">
        <KCheckbox.Indicator class="text-primary-foreground">
          <svg viewBox="0 0 16 16" class="size-3" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m3 8.5 3.2 3L13 4.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </KCheckbox.Indicator>
      </KCheckbox.Control>
      {p.label && <KCheckbox.Label class="text-sm">{p.label}</KCheckbox.Label>}
    </KCheckbox>
  );
}
