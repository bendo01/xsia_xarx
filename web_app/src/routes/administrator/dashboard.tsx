import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Errored, For, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Kpi from '../../components/chart/Kpi';
import PageHeader from '../../components/student/PageHeader';
import { formatNumber, t } from '../../i18n';
import { getAdministratorCounts } from '../../lib/administrator-data';

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
      </div>
    </Errored>
  );
}
