import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../../components/Pager';
import PageHeader from '../../../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../../components/ui/table';
import { t } from '../../../../../../../i18n';
import { REFERENSI_SLUGS, feederCell, feederColumns, feederLabel, feederTitle } from '../../../../../../../lib/feeder';
import { getFeederPage } from '../../../../../../../lib/institution-data';
import { parsePage } from '../../../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const load = (id: string, slug: string, q: Query) => getFeederPage(id, 'referensi', slug, parsePage(q.page));

export const route = {
  preload: ({ params, location }) => {
    if (REFERENSI_SLUGS.includes(params.slug as string)) void load(params.id as string, params.slug as string, location.query as Query);
  },
} satisfies RouteDefinition;

/** One Feeder master table (read-only): columns come from the first row's readable fields. */
export default function FeederTable() {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(params.id as string, params.slug as string, q()));
  const refreshing = () => isPending(() => data());
  const cols = () => feederColumns(data().data);

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${feederTitle(params.slug as string)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <p class="text-sm"><a href={`/rectorat/institution/${encodeURIComponent(params.id as string)}/feeder`} class="text-primary hover:underline">{t('rt.feeder')}</a></p>
        <PageHeader title={feederTitle(params.slug as string)} />
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow><For each={cols()}>{(c) => <TableHead>{feederLabel(c)}</TableHead>}</For></TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(r) => (
                  <TableRow>
                    <For each={cols()}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={feederLabel(c)}>{feederCell(r[c])}</TableCell>}</For>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={q()} />
      </div>
    </Errored>
  );
}
