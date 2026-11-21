import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../components/Pager';
import PageHeader from '../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { t } from '../../../../i18n';
import { getInstitutionUnits } from '../../../../lib/institution-data';
import { parsePage } from '../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (id: string, q: Query) => getInstitutionUnits(id, parsePage(q.page), one(q.q));

export const route = {
  preload: ({ params, location }) => {
    void load(params.id as string, location.query as Query);
  },
} satisfies RouteDefinition;

/** Rectorat home: the institution's study programs / units, each linking to its dashboard. */
export default function InstitutionUnits() {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(params.id as string, q()));
  const refreshing = () => isPending(() => data());

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="mt-1">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.rectorat.facultiesDepartments')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.rectorat.facultiesDepartments')} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('rt.searchByName')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
        </form>
        <Show
          when={data().data.length > 0}
          fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('rt.tidakAdaDataDitemukan')}</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('rt.programStudi')}</TableHead>
                <TableHead>{t('rt.jenjang')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(u) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('rt.programStudi')}>{u.name || '-'}</TableCell>
                    <TableCell label={t('rt.jenjang')}>{u.education?.name ?? u.unit_type?.name ?? '-'}</TableCell>
                    <TableCell class="text-end">
                      <a href={`/rectorat/institution/${encodeURIComponent(params.id as string)}/unit/${encodeURIComponent(u.id)}`} class="text-sm font-medium text-primary hover:underline">{t('cd.detail')}</a>
                    </TableCell>
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
