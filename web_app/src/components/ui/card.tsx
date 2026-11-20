import type { JSX } from '@solidjs/web';
import { omit } from 'solid-js';
import { cn } from '../../lib/utils';

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, 'class'> & { class?: string };

function make(base: string) {
  return (props: DivProps) => {
    const rest = omit(props, 'class');
    return <div class={cn(base, props.class)} {...rest} />;
  };
}

export const Card = make('rounded-xs border border-border bg-card text-card-foreground shadow-xs');
export const CardHeader = make('flex flex-col gap-1.5 p-5');
export const CardTitle = make('font-semibold leading-none tracking-tight');
export const CardDescription = make('text-sm text-muted-foreground');
export const CardContent = make('p-5 pt-0');
export const CardFooter = make('flex items-center p-5 pt-0');
