import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';
import { cn } from '../../lib/utils';

export function Label(props: Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, 'class'> & { class?: string }) {
  const rest = omit(props, 'class');
  return <label class={cn('text-sm font-medium leading-none', props.class)} {...rest} />;
}
