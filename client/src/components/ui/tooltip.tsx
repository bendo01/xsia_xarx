import { Tooltip as KTooltip } from "@kobalte/core/tooltip";
import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

export function Tooltip(p: { content: JSX.Element; children: JSX.Element; class?: string }) {
  return (
    <KTooltip openDelay={200} gutter={6}>
      <KTooltip.Trigger as="span" class="inline-flex">{p.children}</KTooltip.Trigger>
      <KTooltip.Portal>
        <KTooltip.Content class={cn("z-50 rounded-md bg-foreground px-2.5 py-1 text-xs text-background shadow-md origin-[var(--kb-tooltip-content-transform-origin)] transition-[opacity,transform] duration-150 data-[closed]:scale-95 data-[closed]:opacity-0", p.class)}>
          {p.content}
        </KTooltip.Content>
      </KTooltip.Portal>
    </KTooltip>
  );
}
