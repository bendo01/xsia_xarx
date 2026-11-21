import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../../components/Pager';
import DeleteButton from '../../../../../../../components/crud/DeleteButton';
import PageHeader from '../../../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../../components/ui/table';
import { t } from '../../../../../../../i18n';
import { getUnitStaff } from '../../../../../../../lib/unit';
import { parsePage } from '../../../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (q: Query) => getUnitStaff(parsePage(q.page), one(q.q));
const day = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 10) : '-');

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

/** Staff assigned to the study program (read-only). */
export default function UnitStaff() {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(q()));
  const refreshing = () => isPending(() => data());

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('menu.courseDepartment.staffDirectory')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.courseDepartment.staffDirectory')} actions={<a href="/course-department/institution/master/staff/create" class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.addNew')}</a>} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.fName')}</TableHead>
                <TableHead>{t('cd.fCode')}</TableHead>
                <TableHead>{t('cd.fDecree')}</TableHead>
                <TableHead>{t('cd.fStartDate')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(s) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('cd.fName')}>{s.name ?? '-'}</TableCell>
                    <TableCell class="font-mono" label={t('cd.fCode')}>{s.code ?? '-'}</TableCell>
                    <TableCell label={t('cd.fDecree')}>{s.decree_number ?? '-'}</TableCell>
                    <TableCell label={t('cd.fStartDate')}>{`${day(s.start_date)} – ${s.end_date ? day(s.end_date) : '…'}`}</TableCell>
                    <TableCell class="text-end">
                      <span class="inline-flex items-center gap-x-4 text-sm font-medium">
                        <a href={`/course-department/institution/master/staff/${encodeURIComponent(s.id)}/edit`} class="text-primary hover:underline">{t('cd.edit')}</a>
                        <DeleteButton resource="staff" id={s.id} class="text-destructive hover:underline" />
                      </span>
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
