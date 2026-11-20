import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import LecturerProfileView from '../../../../../../../components/lecturer/LecturerProfileView';
import { t } from '../../../../../../../i18n';
import { getLecturerById } from '../../../../../../../lib/lecturer';

export const route = {
  preload: ({ params }) => {
    void getLecturerById(params.id as string);
  },
} satisfies RouteDefinition;

/** A lecturer's master record (the same view as the profile, keyed by lecturer id). */
export default function LecturerMasterDetail() {
  const params = useParams();
  const rec = createMemo(() => getLecturerById(params.id as string));
  const refreshing = () => isPending(() => rec());

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('lc.failedToLoadLecturerData')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('lc.lecturer')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <LecturerProfileView
          individual={{ name: rec().name ?? rec().code, front_title: rec().front_title, last_title: rec().last_title }}
          lecturer={rec()}
        />
      </div>
    </Errored>
  );
}
