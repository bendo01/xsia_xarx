import { Switch as KSwitch } from "@kobalte/core/switch";
import { cn } from "~/lib/utils";

export function Switch(p: { checked?: boolean; onChange?: (v: boolean) => void; label?: string; disabled?: boolean; class?: string }) {
  return (
    <KSwitch checked={p.checked} onChange={p.onChange} disabled={p.disabled} class={cn("inline-flex items-center gap-2", p.class)}>
      <KSwitch.Input />
      <KSwitch.Control class="inline-flex h-5 w-9 items-center rounded-full bg-input p-0.5 transition-colors data-[checked]:bg-primary data-[disabled]:opacity-50">
        <KSwitch.Thumb class="size-4 rounded-full bg-white shadow transition-transform data-[checked]:translate-x-4" />
      </KSwitch.Control>
      {p.label && <KSwitch.Label class="text-sm">{p.label}</KSwitch.Label>}
    </KSwitch>
  );
}
