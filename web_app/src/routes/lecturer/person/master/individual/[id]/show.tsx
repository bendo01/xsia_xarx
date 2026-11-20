import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import LecturerProfileView from '../../../../../../components/lecturer/LecturerProfileView';
import { t } from '../../../../../../i18n';
import { getLecturerProfile } from '../../../../../../lib/lecturer';

export const route = {
  preload: ({ params }) => {
    void getLecturerProfile(params.id as string);
  },
} satisfies RouteDefinition;

/** Lecturer home: identity, teaching-credit trend, biodata and academic history. */
export default function LecturerProfile() {
  const params = useParams();
  const profile = createMemo(() => getLecturerProfile(params.id as string));
  const refreshing = () => isPending(() => profile());

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('lc.failedToLoadLecturerData')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.lecturer.lecturerProfile')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <LecturerProfileView
          individual={profile().individual}
          refs={profile().refs}
          emails={profile().emails}
          phones={profile().phones}
          lecturer={profile().lecturer}
        />
      </div>
    </Errored>
  );
}
