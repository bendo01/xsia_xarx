import { Tabs as KTabs } from '@kobalte/core/tabs';
import type { JSX } from '@solidjs/web';
import { cn } from '../../lib/utils';

export const Tabs = KTabs;

export const TabsList = (p: { class?: string; children: JSX.Element }) => (
  <KTabs.List class={cn('relative inline-flex h-9 max-w-full items-center overflow-x-auto rounded-xs bg-muted p-1 text-muted-foreground', p.class)}>
    {p.children}
    <KTabs.Indicator class="absolute rounded-xs bg-card shadow-xs transition-all duration-200 data-[orientation=horizontal]:bottom-1 data-[orientation=horizontal]:top-1" />
  </KTabs.List>
);
export const TabsTrigger = (p: { value: string; class?: string; children: JSX.Element }) => (
  <KTabs.Trigger
    value={p.value}
    class={cn('relative z-10 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xs px-3 py-1 text-sm font-medium transition-colors data-[selected]:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', p.class)}
  >
    {p.children}
  </KTabs.Trigger>
);
export const TabsContent = (p: { value: string; class?: string; children: JSX.Element }) => (
  <KTabs.Content value={p.value} class={cn('mt-3 focus-visible:outline-none', p.class)}>
    {p.children}
  </KTabs.Content>
);
