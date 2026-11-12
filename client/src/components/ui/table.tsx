import type { JSX } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/utils";

export function Table(props: JSX.HTMLAttributes<HTMLTableElement>) {
  const [local, rest] = splitProps(props, ["class"]);
  return (
    <div class="relative w-full overflow-x-auto rounded-lg border border-border">
      <table class={cn("w-full caption-bottom text-sm", local.class)} {...rest} />
    </div>
  );
}
export const TableHeader = (p: JSX.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead {...p} class={cn("bg-muted/50 [&_tr]:border-b", p.class)} />
);
export const TableBody = (p: JSX.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody {...p} class={cn("[&_tr:last-child]:border-0", p.class)} />
);
export const TableRow = (p: JSX.HTMLAttributes<HTMLTableRowElement>) => (
  <tr {...p} class={cn("border-b border-border transition-colors hover:bg-muted/50", p.class)} />
);
export const TableHead = (p: JSX.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th {...p} class={cn("h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground", p.class)} />
);
export const TableCell = (p: JSX.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td {...p} class={cn("px-3 py-2.5 align-middle", p.class)} />
);
