import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { adminUrl, parseSort, sortableFields, type AdminResource } from '../../lib/admin-resources';
import { deleteAdminRow, getAdminRecords } from '../../lib/admin-crud-data';
import { parsePage, parsePageSize, withParams } from '../../lib/url';
import DeleteRow from '../rectorat/DeleteRow';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Same call shape in a route's preload and in the page (query() keys on the arguments). */
export const loadAdminList = (key: string, q: Query) => getAdminRecords(key, parsePage(q.page), one(q.q), parsePageSize(q.size), one(q.sort), one(q.dir));

const show = (v: unknown) => (v === true ? '✓' : v === false ? '–' : v === null || v === undefined || v === '' ? '' : String(v).slice(0, 120));

/** Search + table + pager of one registered resource, with add / edit / delete for the administrator. */
export default function AdminList(props: { resource: AdminResource }) {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => loadAdminList(props.resource.key, q()));
  const refreshing = () => isPending(() => data());
  const r = () => props.resource;
  const sorted = () => parseSort(r(), one(q().sort), one(q().dir));
  // Clicking the sorted column flips its direction; any other column starts ascending. Back to page 1.
  const sortHref = (field: string) => withParams(q(), { sort: field, dir: sorted()?.sort_by === field && sorted()?.sort_dir === 'asc' ? 'desc' : 'asc', page: null });
  const arrow = (field: string) => (sorted()?.sort_by === field ? (sorted()?.sort_dir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(r().titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader
          title={t(r().titleKey)}
          actions={<>
            <For each={r().extraLinks ?? []}>{(l) => <a href={adminUrl(r(), l.segment)} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t(l.label)}</a>}</For>
            <button type="button" onClick={() => window.print()} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.print')}</button>
            <a href={`/api/administrator/export/${encodeURIComponent(r().key)}${withParams({ q: one(q().q), sort: one(q().sort), dir: one(q().dir) }, {})}`} download class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.exportCSV')}</a>
            <Show when={!r().readOnly && (!r().noCreate || r().customCreate)}><a href={adminUrl(r(), 'create')} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.addNew')}</a></Show></>}
        />
        <form method="get" class="flex flex-wrap items-center gap-2 print:hidden">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <Show when={sorted()}><input type="hidden" name="sort" value={sorted()!.sort_by} /><input type="hidden" name="dir" value={sorted()!.sort_dir} /></Show>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={r().columns}>
                  {(c) => (
                    <TableHead aria-sort={sorted()?.sort_by === c.field ? (sorted()?.sort_dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                      <Show when={sortableFields(r()).includes(c.field)} fallback={t(c.label)}>
                        <a href={sortHref(c.field)} class="hover:text-primary">{t(c.label)}{arrow(c.field)}</a>
                      </Show>
                    </TableHead>
                  )}
                </For>
                <Show when={!r().readOnly}><TableHead class="text-end">{t('ad.actions')}</TableHead></Show>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(row) => (
                  <TableRow>
                    <For each={r().columns}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{i() === 0 ? <a href={r().hasProfile ? adminUrl(r(), String(row.id), 'profile') : adminUrl(r(), String(row.id))} class="text-primary hover:underline">{show(row[c.field]) || String(row.id).slice(0, 8)}</a> : show(row[c.field])}</TableCell>}</For>
                    <Show when={!r().readOnly}>
                      <TableCell class="text-end" label={t('ad.actions')}>
                        <span class="inline-flex gap-x-4">
                          <Show when={r().hasProfile}><a href={adminUrl(r(), String(row.id), 'profile')} class="text-sm font-medium text-primary hover:underline">{t('ad.profile')}</a></Show>
                          <Show when={r().permissionOwner}><a href={adminUrl(r(), String(row.id), 'permissions')} class="text-sm font-medium text-primary hover:underline">{t('ad.permissions')}</a></Show>
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
        <div class="print:hidden"><Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={q()} pageSize={parsePageSize(q().size)} total={data().pagination.total_data} /></div>
      </div>
    </Errored>
  );
}
