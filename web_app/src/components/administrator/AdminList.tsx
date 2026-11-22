import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { adminUrl, type AdminResource } from '../../lib/admin-resources';
import { deleteAdminRow, getAdminRecords } from '../../lib/admin-crud-data';
import { parsePage, parsePageSize } from '../../lib/url';
import DeleteRow from '../rectorat/DeleteRow';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Same call shape in a route's preload and in the page (query() keys on the arguments). */
export const loadAdminList = (key: string, q: Query) => getAdminRecords(key, parsePage(q.page), one(q.q), parsePageSize(q.size));

const show = (v: unknown) => (v === true ? '✓' : v === false ? '–' : v === null || v === undefined || v === '' ? '' : String(v).slice(0, 120));

/** Search + table + pager of one registered resource, with add / edit / delete for the administrator. */
export default function AdminList(props: { resource: AdminResource }) {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => loadAdminList(props.resource.key, q()));
  const refreshing = () => isPending(() => data());
  const r = () => props.resource;

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(r().titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader
          title={t(r().titleKey)}
          actions={<Show when={!r().readOnly && !r().noCreate}><a href={adminUrl(r(), 'create')} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.addNew')}</a></Show>}
        />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={r().columns}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For>
                <Show when={!r().readOnly}><TableHead class="text-end">{t('ad.actions')}</TableHead></Show>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(row) => (
                  <TableRow>
                    <For each={r().columns}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{i() === 0 ? <a href={adminUrl(r(), String(row.id))} class="text-primary hover:underline">{show(row[c.field]) || String(row.id).slice(0, 8)}</a> : show(row[c.field])}</TableCell>}</For>
                    <Show when={!r().readOnly}>
                      <TableCell class="text-end" label={t('ad.actions')}>
                        <span class="inline-flex gap-x-4">
                          <a href={adminUrl(r(), String(row.id), 'edit')} class="text-sm font-medium text-primary hover:underline">{t('cd.edit')}</a>
                          <DeleteRow remove={() => deleteAdminRow(r().key, String(row.id))} />
                        </span>
                      </TableCell>
                    </Show>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={q()} pageSize={parsePageSize(q().size)} total={data().pagination.total_data} />
      </div>
    </Errored>
  );
}
