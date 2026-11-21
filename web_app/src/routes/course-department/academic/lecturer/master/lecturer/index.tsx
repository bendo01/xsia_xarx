import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../components/Pager';
import PageHeader from '../../../../../../components/student/PageHeader';
import { Badge } from '../../../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { t } from '../../../../../../i18n';
import { getUnitLecturers } from '../../../../../../lib/unit';
import { parsePage } from '../../../../../../lib/url';
import { fullName } from '../../../../../../lib/student-select';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (q: Query) => getUnitLecturers(parsePage(q.page), one(q.q));

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

const nameOf = (v: any) => (v && typeof v === 'object' ? v.name : undefined);

/** Lecturers of the unit (homebase), searchable by name or code. */
export default function UnitLecturers() {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(q()));
  const refreshing = () => isPending(() => data());

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="mt-1">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.courseDepartment.lecturerDirectory')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.courseDepartment.lecturerDirectory')} />

        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q)}>
            <a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a>
          </Show>
        </form>

        <Show
          when={data().data.length > 0}
          fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">-</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.nim')}</TableHead>
                <TableHead>{t('cd.lecturerGroup')}</TableHead>
                <TableHead>{t('cd.contractType2')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(l) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('cd.mahasiswa')}>
                      <span class="block">{fullName({ name: l.name ?? l.individual?.name ?? '-', front_title: l.front_title, last_title: l.last_title })}</span>
                      <span class="font-mono text-xs text-muted-foreground-1">{l.nidn || l.code || ''}</span>
                    </TableCell>
                    <TableCell label={t('cd.lecturerGroup')}>{l.group_name ?? nameOf(l.group) ?? '-'}</TableCell>
                    <TableCell label={t('cd.contractType2')}>{l.contract_name ?? nameOf(l.contract) ?? '-'}</TableCell>
                    <TableCell label={t('cd.status')}>
                      <Badge variant="outline">{l.status_name ?? nameOf(l.status) ?? '-'}</Badge>
                    </TableCell>
                    <TableCell class="text-end">
                      <a href={`/course-department/academic/lecturer/master/lecturer/${encodeURIComponent(l.id)}`} class="text-sm font-medium text-primary hover:underline">{t('cd.detail')}</a>
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
