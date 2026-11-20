import { ChevronDown, Menu, Search } from '@lucide/solid';
import { For, Show } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { changeRoleAction, signOutAction } from '../../lib/auth';
import { t } from '../../i18n';
import { normalizeRoleName, type SessionUser, type UserRoleItem } from '../../lib/roles';
import LocaleToggle from '../navigation/LocaleToggle';
import ThemeToggle from '../navigation/ThemeToggle';
import { getInstitutionLogo } from '../../lib/institution';
import { Icon } from './icons';
import { DRAWER_ID } from './NavDrawer';

export const roleLabel = (role: UserRoleItem | null | undefined, fallbackKey = 'guest') => {
  const key = normalizeRoleName(role?.name, role);
  const base = t(`roles.${key}`) === `roles.${key}` ? (role?.name ?? fallbackKey) : t(`roles.${key}`);
  return role?.code ? `${base} (${role.code})` : base;
};

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join('') || '?';

/** Preline navbar: sidebar toggle (mobile), search/command palette, toggles, role switcher, profile. */
export default function Header(props: {
  user: SessionUser | null;
  roles: UserRoleItem[];
  activeRoleId: string | null;
  onOpenSearch: () => void;
}) {
  const active = () => props.roles.find((r) => r.id === props.activeRoleId) ?? null;

  return (
    <header class="sticky top-0 z-50 flex w-full flex-wrap border-b border-navbar-line bg-navbar py-2.5">
      <nav class="mx-auto flex w-full items-center justify-between gap-x-2 px-3 sm:gap-x-3 sm:px-6" aria-label="Top">
        <div class="flex items-center gap-x-3">
          <a href="/" class="flex items-center gap-x-2 font-semibold text-foreground focus:outline-hidden" aria-label={env.VITE_APP_NAME}>
            <img src={getInstitutionLogo() ?? '/favicon.ico'} alt="" class="size-8 rounded-xs object-contain" />
            <span class="hidden sm:inline">{env.VITE_APP_NAME}</span>
          </a>

          <button
            type="button"
            onClick={() => props.onOpenSearch()}
            class="hidden h-9 items-center gap-x-2 rounded-xs border border-layer-line bg-layer px-3 text-sm text-muted-foreground-1 hover:bg-layer-hover focus:outline-hidden sm:flex sm:w-64"
          >
            <Search class="size-4 shrink-0" />
            <span class="flex-1 text-start">{t('common.search')}</span>
            <kbd class="rounded-xs border border-layer-line px-1.5 text-xs">Ctrl K</kbd>
          </button>
        </div>

        <div class="flex items-center gap-x-1.5 sm:gap-x-2">
          <ThemeToggle />
          <LocaleToggle />

          {/* Role switcher: only for users holding more than one role. */}
          <Show when={props.roles.length > 1}>
            <div class="hs-dropdown [--auto-close:inside] [--placement:bottom-right] relative inline-flex">
              <button
                type="button"
                class="hs-dropdown-toggle inline-flex h-9 items-center gap-x-2 rounded-xs border border-layer-line bg-layer px-2.5 text-sm font-medium text-layer-foreground hover:bg-layer-hover focus:outline-hidden sm:px-3"
                aria-haspopup="menu"
                aria-expanded="false"
                aria-label={t('nav.switchRole')}
              >
                <Icon name="users" class="size-4 shrink-0 sm:hidden" />
                <span class="hidden max-w-40 truncate sm:inline">{roleLabel(active())}</span>
                <ChevronDown class="hidden size-4 hs-dropdown-open:rotate-180 sm:block" />
              </button>
              <div class="hs-dropdown-menu z-70 mt-2 hidden min-w-60 max-w-[calc(100vw-1.5rem)] rounded-xs border border-dropdown-line bg-dropdown opacity-0 shadow-md transition-[opacity,margin] duration hs-dropdown-open:opacity-100" role="menu" aria-orientation="vertical">
                <div class="space-y-0.5 p-1">
                  <p class="block px-3 pb-1 pt-2 text-xs font-medium uppercase text-muted-foreground-1">{t('nav.rolesAvailable', { count: props.roles.length })}</p>
                  <For each={props.roles}>
                    {(role) => (
                      <form action={changeRoleAction.with(role.id)} method="post">
                        <button
                          type="submit"
                          role="menuitem"
                          aria-current={role.id === props.activeRoleId ? 'true' : undefined}
                          class={[
                            'flex w-full items-center gap-x-3.5 rounded-xs px-3 py-2 text-start text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:bg-dropdown-item-focus focus:outline-hidden',
                            { 'bg-dropdown-item-active font-medium': role.id === props.activeRoleId },
                          ]}
                        >
                          {roleLabel(role)}
                        </button>
                      </form>
                    )}
                  </For>
                </div>
              </div>
            </div>
          </Show>

          {/* Profile menu */}
          <div class="hs-dropdown [--auto-close:inside] [--placement:bottom-right] relative inline-flex">
            <button
              type="button"
              class="hs-dropdown-toggle inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus:outline-hidden"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-label={t('nav.accountDetails')}
            >
              {initials(props.user?.name ?? '')}
            </button>
            <div class="hs-dropdown-menu z-70 mt-2 hidden min-w-60 max-w-[calc(100vw-1.5rem)] divide-y divide-dropdown-divider rounded-xs border border-dropdown-line bg-dropdown opacity-0 shadow-md transition-[opacity,margin] duration hs-dropdown-open:opacity-100" role="menu" aria-orientation="vertical">
              <div class="px-4 py-3">
                <p class="truncate text-sm font-medium text-foreground">{props.user?.name}</p>
                <p class="truncate text-xs text-muted-foreground-1">{props.user?.email}</p>
                <Show when={active()}>
                  <p class="mt-1 truncate text-xs text-muted-foreground-1">{roleLabel(active())}</p>
                </Show>
              </div>
              <div class="p-1">
                <form action={signOutAction} method="post">
                  <button
                    type="submit"
                    role="menuitem"
                    class="flex w-full items-center gap-x-3.5 rounded-xs px-3 py-2 text-start text-sm text-dropdown-item-foreground hover:bg-dropdown-item-hover focus:bg-dropdown-item-focus focus:outline-hidden"
                  >
                    {t('nav.signOut')}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Opens the navigation drawer (right edge). */}
          <button
            type="button"
            class="flex size-9 items-center justify-center rounded-xs border border-layer-line bg-layer text-layer-foreground hover:bg-layer-hover focus:outline-hidden"
            data-hs-overlay={`#${DRAWER_ID}`}
            aria-controls={DRAWER_ID}
            aria-haspopup="dialog"
            aria-expanded="false"
            aria-label={t('nav.toggleMenu')}
          >
            <Menu class="size-4" />
          </button>
        </div>
      </nav>
    </header>
  );
}
