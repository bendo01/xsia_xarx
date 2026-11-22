import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../components/Pager';
import StatusBadge from '../../../../../../components/student/StatusBadge';
import PageHeader from '../../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { t } from '../../../../../../i18n';
import { getUnitStudents } from '../../../../../../lib/unit';
import { parsePage } from '../../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
// Same call shape in preload and render (query() keys on the arguments).
const load = (q: Query) => getUnitStudents(parsePage(q.page), one(q.q), one(q.year), one(q.status), one(q.sort) || 'code-asc');

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

const field = 'h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm';

/** The unit's students: search, academic year, status and sort live in the URL (plain GET form). */
export default function UnitStudents() {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(q()));
  const refreshing = () => isPending(() => data());
  const filtered = () => !!(one(q().q) || one(q().year) || one(q().status));

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="mt-1">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.courseDepartment.studentDirectory')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.courseDepartment.studentDirectory')} />

        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('cd.cariNIMNamaMahasiswa')} class={`${field} min-w-0 flex-1 sm:max-w-sm`} />
          <select name="year" class={field}>
            <option value="">{t('cd.semuaTahunAjaran')}</option>
            <For each={data().years}>{(y) => <option value={y.id} selected={one(q().year) === y.id}>{y.name}</option>}</For>
          </select>
          <select name="status" class={field}>
            <option value="">{t('cd.status')}</option>
            <For each={data().statuses}>{(s) => <option value={s.id} selected={one(q().status) === s.id}>{s.name}</option>}</For>
          </select>
          <select name="sort" class={field}>
            <option value="code-asc" selected={one(q().sort) === 'code-asc'}>{t('cd.nimCodeAscending')}</option>
            <option value="code-desc" selected={one(q().sort) === 'code-desc'}>{t('cd.nimCodeDescending')}</option>
            <option value="name-asc" selected={one(q().sort) === 'name-asc'}>{t('cd.fullNameAZ')}</option>
            <option value="name-desc" selected={one(q().sort) === 'name-desc'}>{t('cd.fullNameZA')}</option>
          </select>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={filtered()}>
            <a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a>
          </Show>
        </form>

        <Show
          when={data().students.data.length > 0}
          fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.tidakAdaAktivitasMahasiswaDitemukan')}</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.nim')}</TableHead>
                <TableHead>{t('cd.mahasiswa')}</TableHead>
                <TableHead>{t('cd.semesterTahunAjaran')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().students.data}>
                {(s) => (
                  <TableRow>
                    <TableCell class="font-mono" label={t('cd.nim')}>{s.code || '-'}</TableCell>
                    <TableCell class="font-medium" label={t('cd.mahasiswa')}>{s.name || s.individual?.name || '-'}</TableCell>
                    <TableCell label={t('cd.semesterTahunAjaran')}>{s.academic_year?.name ?? s.academic_year_name ?? '-'}</TableCell>
                    <TableCell label={t('cd.status')}><StatusBadge name={s.status?.name ?? s.status_name} /></TableCell>
                    <TableCell class="text-end">
                      <a href={`/course-department/academic/student/master/student/${encodeURIComponent(s.id)}`} class="text-sm font-medium text-primary hover:underline">{t('cd.detail')}</a>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().students.pagination.page} totalPages={data().students.pagination.total_page} search={q()} />
      </div>
    </Errored>
  );
}
