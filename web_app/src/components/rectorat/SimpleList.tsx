import { Title } from '@solidjs/meta';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { parsePage } from '../../lib/url';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Query = Record<string, string | string[] | undefined>;
type Rec = Record<string, any>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export interface SimpleColumn {
  label: string;
  cell: (r: Rec) => string;
}

/** Same call shape in a route's preload and in the page (query() keys on the arguments). */
export const loadSimple = (fn: (id: string, page: number, search: string) => Promise<any>, id: string, q: Query) =>
  fn(id, parsePage(q.page), one(q.q));

/** Institution-wide read-only list: search box, table, pager (no unit picker). */
export default function SimpleList(props: {
  titleKey: string;
  load: (id: string, page: number, search: string) => Promise<any>;
  columns: SimpleColumn[];
  actions?: any;
  rowActions?: (r: Rec) => any;
}) {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => loadSimple(props.load, params.id as string, q()));
  const refreshing = () => isPending(() => data());

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(props.titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t(props.titleKey)} actions={props.actions} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={props.columns}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For>
                <Show when={props.rowActions}><TableHead class="text-end">{t('cd.aksi')}</TableHead></Show>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(r) => (
                  <TableRow>
                    <For each={props.columns}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{c.cell(r)}</TableCell>}</For>
                    <Show when={props.rowActions}><TableCell class="text-end" label={t('cd.aksi')}><span class="inline-flex gap-x-4">{props.rowActions!(r)}</span></TableCell></Show>
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
