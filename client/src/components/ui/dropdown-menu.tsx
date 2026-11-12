import { DropdownMenu as KMenu } from "@kobalte/core/dropdown-menu";
import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

export const DropdownMenu = KMenu;
export const DropdownMenuTrigger = KMenu.Trigger;

export const DropdownMenuContent = (p: { class?: string; children: JSX.Element }) => (
  <KMenu.Portal>
    <KMenu.Content class={cn("z-50 min-w-44 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg origin-[var(--kb-menu-content-transform-origin)] transition-[opacity,transform] duration-150 data-[closed]:scale-95 data-[closed]:opacity-0", p.class)}>
      {p.children}
    </KMenu.Content>
  </KMenu.Portal>
);
export const DropdownMenuItem = (p: { class?: string; onSelect?: () => void; disabled?: boolean; children: JSX.Element }) => (
  <KMenu.Item
    disabled={p.disabled}
    onSelect={p.onSelect}
    class={cn("flex cursor-default select-none items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50", p.class)}
  >
    {p.children}
  </KMenu.Item>
);
export const DropdownMenuSeparator = () => <KMenu.Separator class="-mx-1 my-1 h-px bg-border" />;
