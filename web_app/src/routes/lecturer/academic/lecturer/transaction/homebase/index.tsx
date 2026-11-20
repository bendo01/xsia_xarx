import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Errored, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { HistorySection } from '../../../../../../components/lecturer/LecturerProfileView';
import PageHeader from '../../../../../../components/student/PageHeader';
import { t } from '../../../../../../i18n';
import { getMyLecturer } from '../../../../../../lib/lecturer';

export const route = {
  preload: () => {
    void getMyLecturer();
  },
} satisfies RouteDefinition;

export default function LecturerHomebasePage() {
  const data = createMemo(() => getMyLecturer());
  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('lc.failedToLoadLecturerData')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('lc.homebase')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={t('lc.homebase')} />
      <Show when={data().lecturer} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('lc.noLecturerRecord')}</p>}>
        {(l) => <HistorySection title={t('lc.homebase')} rows={l().homebases.map((h) => ({ id: h.id, name: [h.unit_name, h.status_name, h.contract_name].filter(Boolean).join(' · '), start: h.created_at }))} />}
      </Show>
    </Errored>
  );
}
