import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import UnitAnalytics from '../../../../../../components/unit/UnitAnalytics';
import PageHeader from '../../../../../../components/student/PageHeader';
import { t } from '../../../../../../i18n';
import { getUnitDashboard } from '../../../../../../lib/unit';

export const route = {
  preload: ({ params }) => {
    void getUnitDashboard(params.id as string);
  },
} satisfies RouteDefinition;

/** Study-program dashboard (shared analytics view). */
export default function UnitDashboard() {
  const params = useParams();
  const unit = createMemo(() => getUnitDashboard(params.id as string));
  const refreshing = () => isPending(() => unit());
  const u = () => unit() as Record<string, any>;

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('cd.failedToLoadUnitDetailsFrom')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('cd.unitDashboard')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={u().name || u().nama || t('cd.unitDashboard')} description={t('cd.overviewAndDetailsOfTheSelected')} />
        <UnitAnalytics unit={u()} />
      </div>
    </Errored>
  );
}
