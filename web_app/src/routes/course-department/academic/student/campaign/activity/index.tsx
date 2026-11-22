import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../components/Pager';
import StatusBadge from '../../../../../../components/student/StatusBadge';
import LockStatus from '../../../../../../components/student/LockStatus';
import PageHeader from '../../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { formatNumber, t } from '../../../../../../i18n';
import { getUnitActivities } from '../../../../../../lib/unit';
import { parsePage } from '../../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const dec = (n: unknown) => formatNumber(Number(n) || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const load = (q: Query) => getUnitActivities(parsePage(q.page), one(q.q), one(q.year), one(q.sort) || 'student_code-asc');

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

const field = 'h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm';
const label = (a: any) => a.academic_year?.name ?? a.academic_year_name ?? a.semester_name ?? a.name ?? '-';

/** Semester activities (KRS/KHS records) of the unit's students. */
export default function UnitActivities() {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(q()));
  const refreshing = () => isPending(() => data());
  const rows = () => data().activities.data;

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('cd.failedToLoadStudentActivitiesFor')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('cd.aktivitasKuliahMahasiswa')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('cd.aktivitasKuliahMahasiswa')} />

        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('cd.cariNIMNamaMahasiswa')} class={`${field} min-w-0 flex-1 sm:max-w-sm`} />
          <select name="year" class={field}>
            <option value="">{t('cd.semuaTahunAjaran')}</option>
            <For each={data().years}>{(y) => <option value={y.id} selected={one(q().year) === y.id}>{y.name}</option>}</For>
          </select>
          <select name="sort" class={field}>
            <option value="student_code-asc" selected={one(q().sort) === 'student_code-asc'}>{t('cd.nimCodeAscending')}</option>
            <option value="student_code-desc" selected={one(q().sort) === 'student_code-desc'}>{t('cd.nimCodeDescending')}</option>
            <option value="student_name-asc" selected={one(q().sort) === 'student_name-asc'}>{t('cd.fullNameAZ')}</option>
            <option value="student_name-desc" selected={one(q().sort) === 'student_name-desc'}>{t('cd.fullNameZA')}</option>
          </select>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q) || one(q().year)}>
            <a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a>
          </Show>
        </form>

        <Show
          when={rows().length > 0}
          fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.tidakAdaAktivitasMahasiswaDitemukan')}</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.nim')}</TableHead>
                <TableHead>{t('cd.mahasiswa')}</TableHead>
                <TableHead>{t('cd.semesterTahunAjaran')}</TableHead>
                <TableHead>{t('cd.sks')}</TableHead>
                <TableHead>{t('cd.ips')}</TableHead>
                <TableHead>{t('cd.ipk')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
                <TableHead>{t('st.lockStatus')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={rows()}>
                {(a) => (
                  <TableRow>
                    <TableCell class="font-mono" label={t('cd.nim')}>{a.student_code || '-'}</TableCell>
                    <TableCell class="font-medium" label={t('cd.mahasiswa')}>
                      <Show when={a.student_id} fallback={a.student_name || '-'}>
                        <a href={`/course-department/academic/student/master/student/${encodeURIComponent(a.student_id)}`} class="text-primary hover:underline">{a.student_name || '-'}</a>
                      </Show>
                    </TableCell>
                    <TableCell label={t('cd.semesterTahunAjaran')}>{label(a)}</TableCell>
                    <TableCell label={t('cd.sks')}>{a.total_credit || 0}</TableCell>
                    <TableCell label={t('cd.ips')}>{dec(a.cumulative_index)}</TableCell>
                    <TableCell label={t('cd.ipk')}>{dec(a.grand_cumulative_index || a.cumulative_index)}</TableCell>
                    <TableCell label={t('cd.status')}><StatusBadge name={a.status_name} /></TableCell>
                    <TableCell label={t('st.lockStatus')}><LockStatus locked={!!a.is_lock} /></TableCell>
                    <TableCell class="text-end">
                      <a href={`/course-department/academic/student/campaign/activity/${encodeURIComponent(a.id)}`} class="text-sm font-medium text-primary hover:underline">{t('cd.detail')}</a>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().activities.pagination.page} totalPages={data().activities.pagination.total_page} search={q()} />
      </div>
    </Errored>
  );
}
