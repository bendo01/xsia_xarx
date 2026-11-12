import { createSignal, onCleanup, onMount } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { CommandPalette, type CommandItem } from "~/components/ui/command";

const clean = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/**
 * Ctrl/Cmd+K command palette. Items are harvested from the rendered role menu
 * (`#sidebar-menu-nav`), so it always matches the active role without
 * duplicating menu definitions.
 */
export default function MenuCommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);
  const [items, setItems] = createSignal<CommandItem[]>([]);

  const collect = () => {
    const nav = document.getElementById("sidebar-menu-nav");
    if (!nav) return setItems([]);
    const seen = new Set<string>();
    const out: CommandItem[] = [];
    nav.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      const label = clean(a.textContent);
      if (!href.startsWith("/") || href.includes("[") || !label || seen.has(href)) return;
      seen.add(href);
      const group = clean(a.closest("details")?.querySelector(":scope > summary")?.textContent);
      out.push({ id: href, label, group: group || undefined, onSelect: () => navigate(href) });
    });
    setItems(out);
  };

  const toggle = () => {
    if (!open()) collect();
    setOpen(!open());
  };

  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };
    const onOpen = () => { collect(); setOpen(true); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-command-palette", onOpen);
    onCleanup(() => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-command-palette", onOpen);
    });
  });

  return <CommandPalette open={open()} onOpenChange={setOpen} items={items()} placeholder="Search menu… (Ctrl K)" emptyText="No matching menu" />;
}
