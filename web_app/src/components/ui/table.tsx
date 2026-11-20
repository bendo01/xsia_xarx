import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';
import { cn } from '../../lib/utils';

type P<T> = Omit<T, 'class'> & { class?: string };

export function Table(props: P<JSX.HTMLAttributes<HTMLTableElement>>) {
  const rest = omit(props, 'class');
  return (
    <div class="relative w-full overflow-x-auto rounded-xs border border-border">
      <table class={cn('w-full caption-bottom text-sm', props.class)} {...rest} />
    </div>
  );
}
export const TableHeader = (p: P<JSX.HTMLAttributes<HTMLTableSectionElement>>) => {
  const rest = omit(p, 'class');
  return <thead class={cn('bg-muted/50 [&_tr]:border-b', p.class)} {...rest} />;
};
export const TableBody = (p: P<JSX.HTMLAttributes<HTMLTableSectionElement>>) => {
  const rest = omit(p, 'class');
  return <tbody class={cn('[&_tr:last-child]:border-0', p.class)} {...rest} />;
};
export const TableRow = (p: P<JSX.HTMLAttributes<HTMLTableRowElement>>) => {
  const rest = omit(p, 'class');
  return <tr class={cn('border-b border-border transition-colors hover:bg-muted/50', p.class)} {...rest} />;
};
export const TableHead = (p: P<JSX.ThHTMLAttributes<HTMLTableCellElement>>) => {
  const rest = omit(p, 'class');
  return <th class={cn('h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground', p.class)} {...rest} />;
};
export const TableCell = (p: P<JSX.TdHTMLAttributes<HTMLTableCellElement>>) => {
  const rest = omit(p, 'class');
  return <td class={cn('px-3 py-2.5 align-middle', p.class)} {...rest} />;
};
