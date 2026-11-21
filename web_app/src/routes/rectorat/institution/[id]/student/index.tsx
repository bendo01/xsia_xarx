import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../components/Pager';
import PageHeader from '../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { t } from '../../../../../i18n';
import { getInstitutionStudents } from '../../../../../lib/institution-data';
import { parsePage } from '../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (id: string, q: Query) => getInstitutionStudents(id, parsePage(q.page), one(q.q), one(q.sort) || 'code-asc');

export const route = {
  preload: ({ params, location }) => {
    void load(params.id as string, location.query as Query);
  },
} satisfies RouteDefinition;

/** All students of the institution (read-only): search and sort live in the URL. */
export default function InstitutionStudents() {
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
      <Title>{`${t('menu.rectorat.studentList')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.rectorat.studentList')} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('cd.cariNIMNamaMahasiswa')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <select name="sort" class="h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm">
            <option value="code-asc" selected={one(q().sort) === 'code-asc'}>{t('cd.nimCodeAscending')}</option>
            <option value="code-desc" selected={one(q().sort) === 'code-desc'}>{t('cd.nimCodeDescending')}</option>
            <option value="name-asc" selected={one(q().sort) === 'name-asc'}>{t('cd.fullNameAZ')}</option>
            <option value="name-desc" selected={one(q().sort) === 'name-desc'}>{t('cd.fullNameZA')}</option>
          </select>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
        </form>
        <Show
          when={data().data.length > 0}
          fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('rt.tidakAdaDataDitemukan')}</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.nim')}</TableHead>
                <TableHead>{t('cd.mahasiswa')}</TableHead>
                <TableHead>{t('rt.programStudi')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(s) => (
                  <TableRow>
                    <TableCell class="font-mono" label={t('cd.nim')}>{s.code || '-'}</TableCell>
                    <TableCell class="font-medium" label={t('cd.mahasiswa')}>{s.name || s.individual?.name || '-'}</TableCell>
                    <TableCell label={t('rt.programStudi')}>{s.unit?.name ?? s.unit_name ?? '-'}</TableCell>
                    <TableCell label={t('cd.status')}>{s.status?.name ?? s.status_name ?? '-'}</TableCell>
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
