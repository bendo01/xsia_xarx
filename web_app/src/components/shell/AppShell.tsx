import { useIsRouting, useLocation, useNavigate } from '@solidjs/router';
import type { ParentProps } from 'solid-js';
import { Loading, Show, createEffect, createMemo, createSignal, onSettled } from 'solid-js';

import { t } from '../../i18n';
import { getAuthState } from '../../lib/auth';
import { getMenuForRole } from '../../lib/menu';
import { skeletonKind } from '../../lib/skeleton-kind';
import PageSkeleton from '../ui/page-skeleton';
import { CommandPalette, type CommandItem } from '../ui/command';
import Header, { roleLabel } from './Header';
import { Icon } from './icons';
import { reinitPreline } from './preline';
import NavDrawer from './NavDrawer';

/** The signed-in frame: Preline sidebar + navbar around the page, with a command palette on Ctrl/Cmd+K. */
export default function AppShell(props: ParentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = createMemo(() => getAuthState());

  // While a navigation waits for the next page's data, Solid keeps the old page on screen. After a
  // short grace period (so quick navigations do not flash) show the skeleton of the page we are going to.
  const routing = useIsRouting();
  const [slow, setSlow] = createSignal(false);
  createEffect(
    () => routing(),
    (r) => {
      if (!r) {
        setSlow(false);
        return;
      }
      const id = setTimeout(() => setSlow(true), 120);
      return () => clearTimeout(id);
    },
  );
  // The URL already points at the target while routing; the router's location may still be the old page.
  const targetPath = () => (typeof window === 'undefined' ? location.pathname : window.location.pathname);
  const [searchOpen, setSearchOpen] = createSignal(false);

  const items = createMemo(() => {
    const a = auth();
    return getMenuForRole(a.activeRole, {
      role: a.activeRoleItem,
      roles: a.roles,
      user: a.user,
      defaultInstitutionId: a.defaultInstitutionId,
    });
  });

  const commands = createMemo<CommandItem[]>(() =>
    items().map((item) => ({
      id: item.id,
      label: t(item.labelKey),
      group: roleLabel(auth().activeRoleItem),
      icon: <Icon name={item.icon} />,
      onSelect: () => navigate(item.href),
    })),
  );

  // Preline binds by data-attribute: (re)bind after first paint and after every navigation.
  onSettled(() => {
    reinitPreline();
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  createEffect(
    () => [location.pathname, auth().activeRoleId],
    () => reinitPreline(),
  );

  return (
    <div class="min-h-screen bg-background-1">
      <NavDrawer items={items()} roleLabel={roleLabel(auth().activeRoleItem)} />
      <Header
        user={auth().user}
        roles={auth().roles}
        activeRoleId={auth().activeRoleId}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <main class="w-full px-4 py-6 sm:px-6">
        {/* The frame stays; only the page area shows a skeleton while its data loads. */}
        <Show when={slow()}>
          <PageSkeleton kind={skeletonKind(targetPath())} />
        </Show>
        <Loading fallback={<PageSkeleton kind={skeletonKind(location.pathname)} />}>
          <div class={['w-full', { hidden: slow() }]}>{props.children}</div>
        </Loading>
      </main>
      <CommandPalette
        open={searchOpen()}
        onOpenChange={setSearchOpen}
        items={commands()}
        placeholder={t('common.search')}
        emptyText={t('common.noData')}
      />
    </div>
  );
}
