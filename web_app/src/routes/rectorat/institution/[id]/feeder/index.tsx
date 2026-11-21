import { Title } from '@solidjs/meta';
import { useParams } from '@solidjs/router';
import { For } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../../../components/student/PageHeader';
import { t } from '../../../../../i18n';
import { FEEDER_SLUGS, feederTitle } from '../../../../../lib/feeder';

/** Index of the Feeder (PDDikti) master tables, each opening a read-only paged list. */
export default function FeederIndex() {
  const params = useParams();
  return (
    <>
      <Title>{`${t('rt.feeder')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={t('rt.feeder')} />
      <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <For each={FEEDER_SLUGS}>
          {(slug) => (
            <li class="min-w-0">
              <a href={`/rectorat/institution/${encodeURIComponent(params.id as string)}/feeder/master/${slug}`} class="block truncate rounded-xs border border-card-line bg-card px-3 py-2 text-sm text-primary shadow-2xs hover:bg-muted-hover">{feederTitle(slug)}</a>
            </li>
          )}
        </For>
      </ul>
    </>
  );
}
