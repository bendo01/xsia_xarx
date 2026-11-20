import { useLocation } from '@solidjs/router';
import { For } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { getInstitutionLogo } from '../../lib/institution';
import { isMenuItemActive, type MenuItem } from '../../lib/menu';
import { Icon } from './icons';
import { closeOpenOverlays } from './preline';

export const DRAWER_ID = 'app-nav-drawer';

/**
 * The navigation, as an off-canvas drawer from the right edge on every screen
 * size (Preline `hs-overlay`: opened by any [data-hs-overlay="#app-nav-drawer"]
 * button, closed by the backdrop, Escape or its own close button).
 */
export default function NavDrawer(props: { items: MenuItem[]; roleLabel: string }) {
  const location = useLocation();
  const logo = getInstitutionLogo();

  return (
    <div
      id={DRAWER_ID}
      class="hs-overlay hs-overlay-open:translate-x-0 hidden translate-x-full fixed top-0 inset-e-0 z-80 h-full w-full max-w-xs transform border-s border-sidebar-line bg-sidebar transition-all duration-300"
      role="dialog"
      tabindex="-1"
      aria-label={t('nav.workspaceMenu')}
    >
      <div class="relative flex h-full max-h-full flex-col">
        <header class="flex items-center justify-between gap-x-2 p-4">
          <a href="/" class="flex items-center gap-x-2 text-xl font-semibold text-foreground focus:outline-hidden" aria-label={env.VITE_APP_NAME}>
            <img src={logo ?? '/favicon.ico'} alt="" class="size-8 rounded-xs object-contain" />
            <span>{env.VITE_APP_NAME}</span>
          </a>
          <button
            type="button"
            class="flex size-8 items-center justify-center rounded-xs text-muted-foreground-1 hover:bg-sidebar-nav-hover focus:bg-sidebar-nav-focus focus:outline-hidden"
            data-hs-overlay={`#${DRAWER_ID}`}
            aria-controls={DRAWER_ID}
            aria-label={t('nav.closeSidebar')}
          >
            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </header>

        <nav class="h-full overflow-y-auto px-2 pb-4" aria-label={t('nav.workspaceMenu')}>
          <p class="px-2.5 pb-2 pt-1 text-xs font-medium uppercase text-muted-foreground-1">{props.roleLabel}</p>
          <ul class="space-y-1">
            <For each={props.items}>
              {(item) => {
                const active = () => isMenuItemActive(item, location.pathname);
                return (
                  <li>
                    <a
                      href={item.href}
                      // A click on the page you are already on does not navigate, so close explicitly.
                      onClick={closeOpenOverlays}
                      aria-current={active() ? 'page' : undefined}
                      class={[
                        'flex items-center gap-x-3.5 rounded-xs px-2.5 py-2 text-sm text-sidebar-nav-foreground hover:bg-sidebar-nav-hover focus:bg-sidebar-nav-focus focus:outline-hidden',
                        { 'bg-sidebar-nav-active font-medium': active() },
                      ]}
                    >
                      <Icon name={item.icon} />
                      <span class="truncate">{t(item.labelKey)}</span>
                    </a>
                  </li>
                );
              }}
            </For>
          </ul>
        </nav>
      </div>
    </div>
  );
}
