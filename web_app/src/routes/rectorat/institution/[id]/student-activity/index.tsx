import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../components/Pager';
import StatusBadge from '../../../../../components/student/StatusBadge';
import LockStatus from '../../../../../components/student/LockStatus';
import PageHeader from '../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { formatNumber, t } from '../../../../../i18n';
import { getInstitutionStudentActivities } from '../../../../../lib/institution-data';
import { parsePage, parsePageSize } from '../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const dec = (n: unknown) => formatNumber(Number(n) || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const load = (id: string, q: Query) => getInstitutionStudentActivities(id, parsePage(q.page), one(q.q), one(q.year), parsePageSize(q.size));

export const route = {
  preload: ({ params, location }) => {
    void load(params.id as string, location.query as Query);
  },
} satisfies RouteDefinition;

const field = 'h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm';

/** Semester activities (KRS/KHS records) of every student of the institution (read-only). */
export default function InstitutionStudentActivities() {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(params.id as string, q()));
  const refreshing = () => isPending(() => data());
  const rows = () => data().activities.data;

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('menu.rectorat.studentActivityList')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.rectorat.studentActivityList')} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('cd.cariNIMNamaMahasiswa')} class={`${field} min-w-0 flex-1 sm:max-w-sm`} />
          <select name="year" class={field}>
            <option value="">{t('cd.semuaTahunAjaran')}</option>
            <For each={data().years}>{(y) => <option value={y.id} selected={one(q().year) === y.id}>{y.name}</option>}</For>
          </select>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q) || one(q().year)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={rows().length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.tidakAdaAktivitasMahasiswaDitemukan')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.nim')}</TableHead>
                <TableHead>{t('cd.mahasiswa')}</TableHead>
                <TableHead>{t('cd.semesterTahunAjaran')}</TableHead>
                <TableHead>{t('cd.sks')}</TableHead>
                <TableHead>{t('cd.ips')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
                <TableHead>{t('st.lockStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={rows()}>
                {(a) => (
                  <TableRow>
                    <TableCell class="font-mono" label={t('cd.nim')}>{a.student_code || '-'}</TableCell>
                    <TableCell class="font-medium" label={t('cd.mahasiswa')}>{a.student_name || '-'}</TableCell>
                    <TableCell label={t('cd.semesterTahunAjaran')}>{a.academic_year_name ?? a.academic_year?.name ?? '-'}</TableCell>
                    <TableCell label={t('cd.sks')}>{a.total_credit || 0}</TableCell>
                    <TableCell label={t('cd.ips')}>{dec(a.cumulative_index)}</TableCell>
                    <TableCell label={t('cd.status')}><StatusBadge name={a.status_name} /></TableCell>
                    <TableCell label={t('st.lockStatus')}><LockStatus locked={!!a.is_lock} /></TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().activities.pagination.page} totalPages={data().activities.pagination.total_page} search={q()} pageSize={parsePageSize(q().size)} total={data().activities.pagination.total_data} />
      </div>
    </Errored>
  );
}
