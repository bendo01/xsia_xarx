import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';
import { cn } from '../../lib/utils';

type P<T> = Omit<T, 'class'> & { class?: string };

// Stacked mode: below `sm` (phones) each row becomes a small card instead of a wide row that
// scrolls sideways. It is CSS only (same markup, so it renders identically on the server):
// `Table` sets `data-stacked`, and the parts react to it through the `group/table` variant.
// Each cell shows its column name from its `label` prop (`data-label`); the header row stays
// in the DOM, visually hidden, for screen readers. Tailwind needs whole class names in the
// source, which is why the variants below are spelled out in full.

export function Table(props: P<JSX.HTMLAttributes<HTMLTableElement>> & { stacked?: boolean }) {
  const rest = omit(props, 'class', 'stacked');
  const stacked = () => props.stacked !== false;
  return (
    <div
      class={[
        'relative w-full overflow-x-auto rounded-xs border border-border',
        { 'max-sm:overflow-visible max-sm:rounded-none max-sm:border-0': stacked() },
      ]}
    >
      <table
        data-stacked={stacked() ? '' : undefined}
        class={cn('group/table w-full caption-bottom text-sm max-sm:group-data-[stacked]/table:block', props.class)}
        {...rest}
      />
    </div>
  );
}
export const TableHeader = (p: P<JSX.HTMLAttributes<HTMLTableSectionElement>>) => {
  const rest = omit(p, 'class');
  return <thead class={cn('bg-muted/50 [&_tr]:border-b max-sm:group-data-[stacked]/table:sr-only', p.class)} {...rest} />;
};
export const TableBody = (p: P<JSX.HTMLAttributes<HTMLTableSectionElement>>) => {
  const rest = omit(p, 'class');
  return (
    <tbody
      class={cn('[&_tr:last-child]:border-0 max-sm:group-data-[stacked]/table:block max-sm:group-data-[stacked]/table:[&_tr:last-child]:border', p.class)}
      {...rest}
    />
  );
};
export const TableRow = (p: P<JSX.HTMLAttributes<HTMLTableRowElement>>) => {
  const rest = omit(p, 'class');
  return (
    <tr
      class={cn(
        'border-b border-border transition-colors hover:bg-muted/50 max-sm:group-data-[stacked]/table:mb-3 max-sm:group-data-[stacked]/table:block max-sm:group-data-[stacked]/table:rounded-xs max-sm:group-data-[stacked]/table:border max-sm:group-data-[stacked]/table:bg-card max-sm:group-data-[stacked]/table:p-3',
        p.class,
      )}
      {...rest}
    />
  );
};
export const TableHead = (p: P<JSX.ThHTMLAttributes<HTMLTableCellElement>>) => {
  const rest = omit(p, 'class');
  return <th class={cn('h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground', p.class)} {...rest} />;
};
export const TableCell = (p: P<JSX.TdHTMLAttributes<HTMLTableCellElement>> & { label?: string }) => {
  const rest = omit(p, 'class', 'label');
  return (
    <td
      data-label={p.label}
      class={cn(
        'px-3 py-2.5 align-middle max-sm:group-data-[stacked]/table:flex max-sm:group-data-[stacked]/table:items-center max-sm:group-data-[stacked]/table:justify-between max-sm:group-data-[stacked]/table:gap-3 max-sm:group-data-[stacked]/table:px-0 max-sm:group-data-[stacked]/table:py-1.5 max-sm:group-data-[stacked]/table:text-end max-sm:group-data-[stacked]/table:before:shrink-0 max-sm:group-data-[stacked]/table:before:text-start max-sm:group-data-[stacked]/table:before:text-xs max-sm:group-data-[stacked]/table:before:font-medium max-sm:group-data-[stacked]/table:before:uppercase max-sm:group-data-[stacked]/table:before:tracking-wide max-sm:group-data-[stacked]/table:before:text-muted-foreground-1 max-sm:group-data-[stacked]/table:before:content-[attr(data-label)]',
        p.class,
      )}
      {...rest}
    />
  );
};
