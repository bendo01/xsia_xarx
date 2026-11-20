import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';
import { cn } from '../../lib/utils';

export function Textarea(props: Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, 'class'> & { class?: string }) {
  const rest = omit(props, 'class');
  return (
    <textarea
      class={cn(
        'flex min-h-20 w-full rounded-xs border border-input bg-card px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )}
      {...rest}
    />
  );
}
