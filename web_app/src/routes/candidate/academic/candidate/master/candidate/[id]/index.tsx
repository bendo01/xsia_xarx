import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import AdmissionDashboard from '../../../../../../../components/candidate/AdmissionDashboard';
import { t } from '../../../../../../../i18n';
import { getAdmissionLookups, getAdmissionStatus } from '../../../../../../../lib/admission';

export const route = {
  preload: ({ params }) => {
    void getAdmissionStatus(params.id as string);
    void getAdmissionLookups();
  },
} satisfies RouteDefinition;

/** The candidate's own admission dashboard. */
export default function CandidateDashboard() {
  const params = useParams();
  const status = createMemo(() => getAdmissionStatus(params.id as string));
  const lookups = createMemo(() => getAdmissionLookups());
  const refreshing = () => isPending(() => status());

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('cn.gagalMemuatDataPendaftaran')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('cn.calonMahasiswa')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <Show when={status().candidate}>
          <AdmissionDashboard id={params.id as string} data={status()} lookups={lookups()} />
        </Show>
      </div>
    </Errored>
  );
}
