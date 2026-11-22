import { ShieldCheck } from '@lucide/solid';
import type { JSX } from '@solidjs/web';
import { Show, createSignal } from 'solid-js';

import { t } from '../../i18n';
import { getInstitutionLogo } from '../../lib/institution';
import LocaleToggle from '../navigation/LocaleToggle';
import ThemeToggle from '../navigation/ThemeToggle';
import ParticleCanvas from './ParticleCanvas';

/** Shared frame of every /authentification page: ambient background, toggles, card, logo. */
export default function AuthShell(props: {
  badge?: string;
  /** Wider card for long forms. */
  wide?: boolean;
  title: string;
  subtitle?: string;
  children: JSX.Element;
  footer?: JSX.Element;
}) {
  const logo = getInstitutionLogo();
  const [logoFailed, setLogoFailed] = createSignal(false);

  return (
    <div class="relative flex min-h-screen w-full select-none items-center justify-center overflow-hidden bg-neutral-50 px-4 py-8 dark:bg-[#0A0F1D]">
      <div class="pointer-events-none absolute inset-0 z-0 h-full w-full">
        <div class="absolute -left-[10%] -top-[15%] h-[65%] w-[65%] rounded-xs bg-[#0d9488]/30 opacity-35 blur-[120px] dark:opacity-70" />
        <div class="absolute -bottom-[20%] -left-[10%] h-[60%] w-[60%] rounded-xs bg-[#3b82f6]/25 opacity-30 blur-[120px] dark:opacity-60" />
        <div class="absolute -bottom-[15%] -right-[10%] h-[65%] w-[65%] rounded-xs bg-[#10b981]/25 opacity-30 blur-[120px] dark:opacity-60" />
        <ParticleCanvas />
      </div>

      <div class="absolute right-4 top-4 z-20 flex items-center gap-2">
        <ThemeToggle />
        <LocaleToggle />
      </div>

      <main class={['relative z-10 flex w-full flex-col items-center rounded-xs border border-neutral-300 bg-white/95 p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] backdrop-blur-2xl sm:p-10 dark:border-emerald-500/20 dark:bg-slate-900/60 dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]', props.wide ? 'max-w-3xl' : 'max-w-lg']}>
        <Show when={props.badge}>
          <div class="mb-5 inline-flex items-center gap-2 rounded-xs border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-300">
            <span class="size-2 rounded-xs bg-emerald-400" />
            <span>{props.badge}</span>
          </div>
        </Show>

        <Show
          when={logo && !logoFailed()}
          fallback={
            <ShieldCheck class="mb-4 size-10 text-emerald-700 dark:text-emerald-400" />
          }
        >
          <img
            src={logo!}
            alt="Logo"
            onError={() => setLogoFailed(true)}
            class="mb-4 size-20 object-contain drop-shadow-lg transition-transform duration-300 hover:scale-105"
          />
        </Show>

        <h1 class="mb-1 text-[26px] font-bold tracking-wide text-foreground sm:text-[30px]">{props.title}</h1>
        <Show when={props.subtitle}>
          <p class="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-white/60">{props.subtitle}</p>
        </Show>

        <div class="w-full">{props.children}</div>

        <div class="mt-2 flex w-full items-center justify-between border-t border-neutral-200 pt-4 text-xs text-neutral-500 dark:border-white/10 dark:text-white/50">
          {props.footer ?? <span />}
          <a href="/" class="transition-colors hover:text-neutral-900 dark:hover:text-white">
            {t('menu.guest.home')}
          </a>
        </div>
      </main>
    </div>
  );
}
