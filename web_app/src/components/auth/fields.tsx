import type { JSX } from '@solidjs/web';
import { Show, createSignal } from 'solid-js';

import { t } from '../../i18n';
import { cn } from '../../lib/utils';
import { Spinner } from '../loader/Spinner';

const inputClass =
  'w-full rounded-xs border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-inner transition-all placeholder:text-neutral-400 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-emerald-500/20 dark:bg-[#111827]/70 dark:placeholder:text-white/30';

// Functions, not JSX constants: JSX evaluated at module load runs outside any
// component owner (breaks SSR hydration keys) and would share one DOM node.
const icons = {
  mail: () => (<><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>),
  lock: () => (<><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>),
  phone: () => (<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />),
  key: () => (<><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></>),
};

export function FieldIcon(props: { name: keyof typeof icons }) {
  return (
    <span class="pointer-events-none absolute left-4 text-neutral-400 dark:text-white/40">
      <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        {icons[props.name]()}
      </svg>
    </span>
  );
}

/** Labelled input with a leading icon (`password` type gets a show/hide toggle). */
export function AuthField(props: {
  label: string;
  icon: keyof typeof icons;
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  autocomplete?: string;
  required?: boolean;
  onInput?: (value: string) => void;
}) {
  const [shown, setShown] = createSignal(false);
  const isPassword = () => props.type === 'password';

  return (
    <label class="block space-y-1">
      <span class="block px-1 text-xs font-medium text-neutral-700 dark:text-white/80">{props.label}</span>
      <span class="relative flex items-center">
        <FieldIcon name={props.icon} />
        <input
          name={props.name}
          type={isPassword() && shown() ? 'text' : (props.type ?? 'text')}
          value={props.value ?? ''}
          placeholder={props.placeholder}
          autocomplete={props.autocomplete}
          required={props.required ?? true}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          class={cn(inputClass, isPassword() && 'pr-11')}
        />
        <Show when={isPassword()}>
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            class="absolute right-3.5 p-1 text-neutral-400 transition-colors hover:text-neutral-900 dark:text-white/40 dark:hover:text-white/90"
            aria-label={shown() ? t('au.sembunyikanKataSandi') : t('au.tampilkanKataSandi')}
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <Show
                when={shown()}
                fallback={<><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>}
              >
                <path d="m9.88 9.88 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" />
              </Show>
            </svg>
          </button>
        </Show>
      </span>
    </label>
  );
}

export function AuthAlert(props: { kind: 'error' | 'success'; children: JSX.Element }) {
  return (
    <div
      role={props.kind === 'error' ? 'alert' : 'status'}
      class={cn(
        'mb-5 flex w-full items-center gap-3 rounded-xs border p-3.5 text-xs font-medium leading-snug',
        props.kind === 'error'
          ? 'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-200'
          : 'border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200',
      )}
    >
      {props.children}
    </div>
  );
}

export function SubmitButton(props: { pending?: boolean; children: JSX.Element; pendingLabel?: string }) {
  return (
    <button
      type="submit"
      disabled={props.pending}
      class="mt-4 flex w-full items-center justify-center gap-2 rounded-xs border border-emerald-400/20 bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-xs font-bold uppercase tracking-[0.12em] text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-300 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Show when={props.pending} fallback={props.children}>
        <Spinner size="sm" />
        <span>{props.pendingLabel ?? props.children}</span>
      </Show>
    </button>
  );
}
