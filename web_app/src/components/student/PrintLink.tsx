import { Icon } from '../shell/icons';

/**
 * A link to a generated PDF (KRS / KHS) with a printer icon. `inline` is a text link for table
 * rows; `button` matches the bordered buttons in page headers. Always opens in a new tab.
 */
export default function PrintLink(props: { href: string; label: string; title?: string; variant?: 'inline' | 'button' }) {
  return (
    <a
      href={props.href}
      target="_blank"
      rel="noopener"
      title={props.title}
      class={
        props.variant === 'button'
          ? 'inline-flex items-center gap-1.5 rounded-xs border border-layer-line bg-layer px-3 py-2 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden'
          : 'inline-flex items-center gap-1 text-primary hover:underline'
      }
    >
      <Icon name="printer" />
      {props.label}
    </a>
  );
}
