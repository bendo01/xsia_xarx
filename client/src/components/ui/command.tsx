import { createMemo, createSignal, For, Show, type JSX } from "solid-js";
import { Dialog as KDialog } from "@kobalte/core/dialog";
import { cn } from "~/lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  group?: string;
  hint?: string;
  icon?: JSX.Element;
  onSelect: () => void;
}

/** cmdk-style command palette. Controlled via open/onOpenChange. */
export function CommandPalette(p: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: CommandItem[];
  placeholder?: string;
  emptyText?: string;
}) {
  const [query, setQuery] = createSignal("");
  const [active, setActive] = createSignal(0);

  const filtered = createMemo(() => {
    const q = query().trim().toLowerCase();
    return q ? p.items.filter((i) => `${i.label} ${i.group ?? ""}`.toLowerCase().includes(q)).slice(0, 50) : p.items.slice(0, 50);
  });

  const run = (item?: CommandItem) => {
    if (!item) return;
    p.onOpenChange(false);
    setQuery("");
    item.onSelect();
  };

  const onKey = (e: KeyboardEvent) => {
    const n = filtered().length;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % Math.max(n, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + n) % Math.max(n, 1)); }
    else if (e.key === "Enter") { e.preventDefault(); run(filtered()[active()]); }
  };

  return (
    <KDialog open={p.open} onOpenChange={(v) => { p.onOpenChange(v); if (!v) setQuery(""); }}>
      <KDialog.Portal>
        <KDialog.Overlay class="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px] transition-opacity duration-150 data-[closed]:opacity-0" />
        <div class="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
          <KDialog.Content class="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl transition-[opacity,transform] duration-150 data-[closed]:scale-95 data-[closed]:opacity-0">
            <KDialog.Title class="sr-only">Command palette</KDialog.Title>
            <input
              autofocus
              value={query()}
              onInput={(e) => { setQuery(e.currentTarget.value); setActive(0); }}
              onKeyDown={onKey}
              placeholder={p.placeholder ?? "Search…"}
              class="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <ul class="max-h-80 overflow-y-auto p-1" role="listbox">
              <Show when={filtered().length > 0} fallback={<li class="px-3 py-6 text-center text-sm text-muted-foreground">{p.emptyText ?? "No results"}</li>}>
                <For each={filtered()}>
                  {(item, i) => (
                    <li
                      role="option"
                      aria-selected={i() === active()}
                      onMouseEnter={() => setActive(i())}
                      onClick={() => run(item)}
                      class={cn("flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm", i() === active() && "bg-accent text-accent-foreground")}
                    >
                      {item.icon}
                      <span class="flex-1 truncate">{item.label}</span>
                      <Show when={item.group}><span class="text-xs text-muted-foreground">{item.group}</span></Show>
                    </li>
                  )}
                </For>
              </Show>
            </ul>
          </KDialog.Content>
        </div>
      </KDialog.Portal>
    </KDialog>
  );
}
