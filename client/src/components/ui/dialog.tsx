import { Dialog as KDialog } from "@kobalte/core/dialog";
import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/utils";

export const Dialog = KDialog;
export const DialogTrigger = KDialog.Trigger;
export const DialogClose = KDialog.CloseButton;

export function DialogContent(props: { class?: string; children: JSX.Element }) {
  const [local, rest] = splitProps(props, ["class", "children"]);
  return (
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] data-[expanded]:animate-in data-[expanded]:fade-in-0 transition-opacity duration-200 data-[closed]:opacity-0" />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <KDialog.Content
          class={cn(
            "w-full max-w-lg rounded-xl border border-border bg-popover p-6 text-popover-foreground shadow-xl origin-center transition-[opacity,transform] duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0",
            local.class,
          )}
          {...rest}
        >
          {local.children}
        </KDialog.Content>
      </div>
    </KDialog.Portal>
  );
}

export const DialogHeader = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} class={cn("mb-4 flex flex-col gap-1.5", props.class)} />
);
export const DialogFooter = (props: JSX.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} class={cn("mt-6 flex justify-end gap-2", props.class)} />
);
export function DialogTitle(props: { class?: string; children: JSX.Element }) {
  return <KDialog.Title class={cn("text-lg font-semibold leading-none", props.class)}>{props.children}</KDialog.Title>;
}
export function DialogDescription(props: { class?: string; children: JSX.Element }) {
  return <KDialog.Description class={cn("text-sm text-muted-foreground", props.class)}>{props.children}</KDialog.Description>;
}
