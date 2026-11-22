import { Title } from '@solidjs/meta';
import { Errored, For, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { formatNumber, t } from '../../i18n';
import { adminUrl, overviewResources, type AdminResource } from '../../lib/admin-resources';
import { getAdminRecords } from '../../lib/admin-crud-data';
import PageHeader from '../student/PageHeader';

/** Total of one resource (a page of one row); an unreachable endpoint shows "–" instead of failing the page. */
const total = (key: string) => getAdminRecords(key, 1, '', 1, '', '').then((r) => r.pagination.total_data).catch(() => null as number | null);

function Card(props: { resource: AdminResource }) {
  const count = createMemo(() => total(props.resource.key));
  return (
    <a href={adminUrl(props.resource)} class="block rounded-xs border border-card-line bg-card p-4 shadow-2xs hover:bg-muted-hover">
      <p class="font-semibold text-primary">{t(props.resource.titleKey)}</p>
      <p class="mt-1 text-2xl font-semibold">{count() === null ? '–' : formatNumber(count() as number)}</p>
    </a>
  );
}

/** The top-level page of an area (location, literate): every resource with its total. */
export default function AdminOverview(props: { group: string }) {
  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(props.group)} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={t(props.group)} />
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <For each={overviewResources(props.group)}>{(r) => <Card resource={r} />}</For>
      </div>
    </Errored>
  );
}
