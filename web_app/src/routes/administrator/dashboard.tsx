import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Errored, For, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Kpi from '../../components/chart/Kpi';
import PageHeader from '../../components/student/PageHeader';
import { formatNumber, t } from '../../i18n';
import { getAdministratorCounts } from '../../lib/administrator-data';
import { ADMIN_RESOURCES, adminUrl } from '../../lib/admin-resources';

interface Module {
  group: string;
  links: { href: string; title: string }[];
}

/** Module cards: registered resources by their top-level menu group, then the custom pages. */
const MODULES: Module[] = (() => {
  const by = new Map<string, Module>();
  for (const r of ADMIN_RESOURCES) {
    const g = r.group?.[0];
    if (g) (by.get(g) ?? by.set(g, { group: g, links: [] }).get(g)!).links.push({ href: adminUrl(r), title: r.titleKey });
  }
  return [
    ...by.values(),
    { group: 'ad.feederPDDikti', links: [{ href: '/administrator/feeder', title: 'ad.feederPDDikti' }] },
    { group: 'ad.agent', links: [{ href: '/administrator/agent/chatbot', title: 'ad.ragTitle' }] },
    { group: 'ad.preference', links: [{ href: '/administrator/preference/application', title: 'ad.applicationPreference' }] },
  ];
})();

export const route = {
  preload: () => {
    void getAdministratorCounts();
  },
} satisfies RouteDefinition;

/** Administrator home: system-wide totals. Module shortcuts are added as each area is ported. */
export default function AdministratorDashboard() {
  const counts = createMemo(() => getAdministratorCounts());
  const refreshing = () => isPending(() => counts());
  const cards = () => [
    { key: 'users', label: t('ad.users'), value: counts().users },
    { key: 'roles', label: t('ad.roles'), value: counts().roles },
    { key: 'permissions', label: t('ad.permissions'), value: counts().permissions },
    { key: 'individuals', label: t('ad.individuals'), value: counts().individuals },
    { key: 'institutions', label: t('ad.institutions'), value: counts().institutions },
  ];

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="mt-1">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('ad.administratorDashboard')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('ad.administratorDashboard')} description={t('ad.quickAccessToTheMainAdministration')} />
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <For each={cards()}>{(c) => <Kpi label={c.label} value={formatNumber(c.value)} />}</For>
        </div>
        <h2 class="text-lg font-semibold text-foreground">{t('ad.modules')}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <For each={MODULES}>
            {(m) => (
              <section class="rounded-xs border border-card-line bg-card p-4 shadow-2xs">
                <h3 class="font-semibold text-foreground">{t(m.group)}</h3>
                <div class="mt-3 flex flex-wrap gap-2 border-t border-card-divider pt-3">
                  <For each={m.links}>{(l) => <a href={l.href} class="rounded-xs bg-secondary px-2 py-1 text-xs font-medium text-foreground/80 hover:text-primary">{t(l.title)}</a>}</For>
                </div>
              </section>
            )}
          </For>
        </div>
      </div>
    </Errored>
  );
}
