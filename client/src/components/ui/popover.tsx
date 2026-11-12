import { Popover as KPopover } from "@kobalte/core/popover";
import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

export const Popover = KPopover;
export const PopoverTrigger = KPopover.Trigger;
export const PopoverContent = (p: { class?: string; children: JSX.Element }) => (
  <KPopover.Portal>
    <KPopover.Content class={cn("z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-lg origin-[var(--kb-popover-content-transform-origin)] transition-[opacity,transform] duration-150 data-[closed]:scale-95 data-[closed]:opacity-0", p.class)}>
      {p.children}
    </KPopover.Content>
  </KPopover.Portal>
);
