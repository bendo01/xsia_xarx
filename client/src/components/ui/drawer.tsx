import Drawer from "corvu/drawer";
import type { JSX } from "solid-js";
import { cn } from "~/lib/utils";

export const DrawerRoot = Drawer;
export const DrawerTrigger = Drawer.Trigger;
export const DrawerClose = Drawer.Close;
export const DrawerTitle = (p: { class?: string; children: JSX.Element }) => (
  <Drawer.Label class={cn("text-lg font-semibold", p.class)}>{p.children}</Drawer.Label>
);
export const DrawerDescription = (p: { class?: string; children: JSX.Element }) => (
  <Drawer.Description class={cn("text-sm text-muted-foreground", p.class)}>{p.children}</Drawer.Description>
);

/** Vaul-style bottom drawer (Corvu). */
export function DrawerContent(p: { class?: string; children: JSX.Element }) {
  return (
    <Drawer.Portal>
      <Drawer.Overlay
        class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]"
        style={{ opacity: "calc(var(--corvu-drawer-transition-progress, 0))" }}
      />
      <Drawer.Content
        class={cn(
          "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl after:absolute after:inset-x-0 after:top-full after:h-1/2 after:bg-inherit data-[transitioning]:transition-transform data-[transitioning]:duration-300",
          p.class,
        )}
      >
        <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        {p.children}
      </Drawer.Content>
    </Drawer.Portal>
  );
}
