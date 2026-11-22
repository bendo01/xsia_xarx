import { Title } from '@solidjs/meta';
import { Show } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../student/PageHeader';
import { t } from '../../i18n';

/** A page whose workspace the old client only stubbed: title, breadcrumb and a short note, no data yet. */
export default function AdminPlaceholder(props: { titleKey: string; groupKey?: string; descriptionKey?: string }) {
  return (
    <>
      <Title>{`${t(props.titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm text-muted-foreground-1">
        <a href="/administrator/dashboard" class="text-primary hover:underline">{t('ad.administrator')}</a>
        <Show when={props.groupKey}><span> / {t(props.groupKey!)}</span></Show>
      </p>
      <PageHeader title={t(props.titleKey)} description={props.descriptionKey ? t(props.descriptionKey) : undefined} />
      <div class="flex min-h-60 flex-col items-center justify-center rounded-xs border border-card-line bg-card p-10 text-center shadow-2xs">
        <h2 class="mb-1.5 text-base font-semibold">{t(props.titleKey)}</h2>
        <p class="max-w-md text-xs text-muted-foreground-1">{t('ad.notAvailableYet')}</p>
      </div>
    </>
  );
}
