import { cn } from '../../lib/utils';

const SIZES = { xs: 'size-3 border-2', sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-8 border-3' };

export function Spinner(props: { size?: keyof typeof SIZES; class?: string; label?: string }) {
  return (
    <span
      role={props.label ? 'status' : undefined}
      aria-label={props.label}
      aria-hidden={props.label ? undefined : 'true'}
      class={cn('inline-block animate-spin rounded-full border-current border-t-transparent', SIZES[props.size ?? 'md'], props.class)}
    />
  );
}
