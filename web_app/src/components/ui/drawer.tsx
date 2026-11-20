// Bottom sheet. The old client used Corvu's Drawer (drag-to-dismiss); Corvu has
// no Solid 2 release, so this is built on Kobalte's Dialog: same exports and
// look, minus the drag gesture (close via overlay click, Escape, or DrawerClose).
import { Dialog as KDialog } from '@kobalte/core/dialog';
import type { JSX } from '@solidjs/web';
import { cn } from '../../lib/utils';

export const DrawerRoot = KDialog;
export const DrawerTrigger = KDialog.Trigger;
export const DrawerClose = KDialog.CloseButton;
export const DrawerTitle = (p: { class?: string; children: JSX.Element }) => (
  <KDialog.Title class={cn('text-lg font-semibold', p.class)}>{p.children}</KDialog.Title>
);
export const DrawerDescription = (p: { class?: string; children: JSX.Element }) => (
  <KDialog.Description class={cn('text-sm text-muted-foreground', p.class)}>{p.children}</KDialog.Description>
);

export function DrawerContent(p: { class?: string; children: JSX.Element }) {
  return (
    <KDialog.Portal>
      <KDialog.Overlay class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 data-[closed]:opacity-0" />
      <KDialog.Content
        class={cn(
          'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-xs border border-border bg-popover p-4 text-popover-foreground shadow-2xl transition-transform duration-300 data-[closed]:translate-y-full',
          p.class,
        )}
      >
        <div class="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted-foreground/30" />
        {p.children}
      </KDialog.Content>
    </KDialog.Portal>
  );
}
