import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';
import { cn } from '../../lib/utils';

export function Input(props: Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'class'> & { class?: string }) {
  const rest = omit(props, 'class');
  return (
    <input
      class={cn(
        'flex h-9 w-full rounded-xs border border-input bg-card px-3 py-1 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
        props.class,
      )}
      {...rest}
    />
  );
}
