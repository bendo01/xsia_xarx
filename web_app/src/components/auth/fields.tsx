import type { JSX } from '@solidjs/web';
import { Eye, EyeOff, KeyRound, Lock, Mail, Phone } from '@lucide/solid';
import { For, Show, createSignal } from 'solid-js';

import { t } from '../../i18n';
import { cn } from '../../lib/utils';
import { Spinner } from '../loader/Spinner';

const inputClass =
  'w-full rounded-xs border border-neutral-300 bg-white py-3 pl-11 pr-4 text-sm text-foreground shadow-inner transition-all placeholder:text-neutral-400 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:border-emerald-500/20 dark:bg-[#111827]/70 dark:placeholder:text-white/30';

export function FieldIcon(props: { name: 'mail' | 'lock' | 'phone' | 'key' }) {
  return (
    <span class="pointer-events-none absolute left-4 text-neutral-400 dark:text-white/40">
      <Show when={props.name === 'mail'}><Mail class="size-4" /></Show>
      <Show when={props.name === 'lock'}><Lock class="size-4" /></Show>
      <Show when={props.name === 'phone'}><Phone class="size-4" /></Show>
      <Show when={props.name === 'key'}><KeyRound class="size-4" /></Show>
    </span>
  );
}

/** Labelled input with a leading icon (`password` type gets a show/hide toggle). */
export function AuthField(props: {
  label: string;
  icon?: 'mail' | 'lock' | 'phone' | 'key';
  name: string;
  type?: string;
  value?: string;
  placeholder?: string;
  autocomplete?: string;
  required?: boolean;
  inputmode?: 'numeric' | 'tel' | 'email' | 'text';
  maxlength?: number;
  minlength?: number;
  onInput?: (value: string) => void;
}) {
  const [shown, setShown] = createSignal(false);
  const isPassword = () => props.type === 'password';

  return (
    <label class="block space-y-1">
      <span class="block px-1 text-xs font-medium text-neutral-700 dark:text-white/80">{props.label}</span>
      <span class="relative flex items-center">
        <Show when={props.icon}>{(icon) => <FieldIcon name={icon()} />}</Show>
        <input
          name={props.name}
          type={isPassword() && shown() ? 'text' : (props.type ?? 'text')}
          value={props.value ?? ''}
          placeholder={props.placeholder}
          autocomplete={props.autocomplete}
          required={props.required ?? true}
          onInput={(e) => props.onInput?.(e.currentTarget.value)}
          inputmode={props.inputmode}
          maxlength={props.maxlength}
          minlength={props.minlength}
          class={cn(inputClass, !props.icon && 'pl-4', isPassword() && 'pr-11')}
        />
        <Show when={isPassword()}>
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            class="absolute right-3.5 p-1 text-neutral-400 transition-colors hover:text-neutral-900 dark:text-white/40 dark:hover:text-white/90"
            aria-label={shown() ? t('au.sembunyikanKataSandi') : t('au.tampilkanKataSandi')}
          >
            <Show when={shown()} fallback={<Eye class="size-4" />}>
              <EyeOff class="size-4" />
            </Show>
          </button>
        </Show>
      </span>
    </label>
  );
}

/** Labelled <select> styled like AuthField (no icon). */
export function AuthSelect(props: {
  label: string;
  name: string;
  value: string;
  placeholder: string;
  options: { id: string; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label class="block space-y-1">
      <span class="block px-1 text-xs font-medium text-neutral-700 dark:text-white/80">{props.label}</span>
      <select
        name={props.name}
        required
        onChange={(e) => props.onChange(e.currentTarget.value)}
        class={cn(inputClass, 'pl-4')}
      >
        <option value="">{props.placeholder}</option>
        <For each={props.options}>{(o) => <option value={o.id} selected={props.value === o.id}>{o.name}</option>}</For>
      </select>
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
