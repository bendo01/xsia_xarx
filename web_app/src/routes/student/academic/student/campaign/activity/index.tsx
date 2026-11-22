import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../components/Pager';
import StatusBadge from '../../../../../../components/student/StatusBadge';
import PageHeader from '../../../../../../components/student/PageHeader';
import StudentSwitcher from '../../../../../../components/student/StudentSwitcher';
import LockStatus from '../../../../../../components/student/LockStatus';
import PrintLink from '../../../../../../components/student/PrintLink';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { formatNumber, t } from '../../../../../../i18n';
import { getStudentActivities } from '../../../../../../lib/student';
import type { ActivityItem } from '../../../../../../lib/student-types';
import { parsePage } from '../../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const dec = (n: number | undefined) => formatNumber(n ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Same call shape in preload and render (query() keys on the arguments).
const load = (q: Query) => getStudentActivities(one(q.student_id), one(q.code), parsePage(q.page));

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

const semesterLabel = (a: ActivityItem) =>
  a.academic_year?.name ?? a.academic_year_name ?? a.semester_name ?? a.name ?? '-';

/** Semester activity records for the selected student identity, with KRS / KHS PDF links. */
export default function StudentActivities() {
  const [search] = useSearchParams();
  const data = createMemo(() => load(search as Query));
  const refreshing = () => isPending(() => data());
  const latest = () => data().activities?.data[0];
  const nim = () => data().selected?.code ?? 'Student';

  // Served by routes/api/student/print: the server adds the session token and streams the PDF.
  const printHref = (kind: 'krs' | 'khs', a: ActivityItem) =>
    `/api/student/print/${kind}/${encodeURIComponent(a.id)}?name=${encodeURIComponent(`${kind.toUpperCase()}_${nim()}_${semesterLabel(a)}`)}`;

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('st.failedToLoadAcademicSemesterActivities')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.student.academicActivities')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader
          title={t('st.academicActivitiesSemesterRecords')}
          description={t('st.trackSemesterActivityCampaignsStudyPlan')}
        />

        <StudentSwitcher students={data().students} selectedId={data().selected?.id} search={search as Query} />

        <section class="grid grid-cols-2 gap-4">
          <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs">
            <p class="text-xs font-medium uppercase text-muted-foreground-1">{t('st.cumulativeGPAIPK')}</p>
            <p class="mt-1 text-2xl font-semibold text-foreground">{dec(latest()?.grand_cumulative_index ?? latest()?.cumulative_index)}</p>
            <p class="text-xs text-muted-foreground-1">{t('st.ips')} {dec(latest()?.cumulative_index)}</p>
          </div>
          <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs">
            <p class="text-xs font-medium uppercase text-muted-foreground-1">{t('st.creditsTakenSKS')}</p>
            <p class="mt-1 text-2xl font-semibold text-foreground">{latest()?.grand_total_credit ?? latest()?.total_credit ?? 0}</p>
            <p class="text-xs text-muted-foreground-1">{t('st.sem')} {latest()?.total_credit ?? 0} {t('st.sks')}</p>
          </div>
        </section>

        <Show
          when={(data().activities?.data.length ?? 0) > 0}
          fallback={
            <p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">
              {t('st.noAcademicSemesterActivityRecordsFound')}
            </p>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('st.semesterCampaign')}</TableHead>
                <TableHead>{t('st.sksSemester')}</TableHead>
                <TableHead>{t('st.semesterIPS')}</TableHead>
                <TableHead>{t('st.cumSKS')}</TableHead>
                <TableHead>{t('st.ipk')}</TableHead>
                <TableHead>{t('st.status')}</TableHead>
                <TableHead>{t('st.lockStatus')}</TableHead>
                <TableHead class="text-end">{t('st.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().activities?.data}>
                {(a) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('st.semesterCampaign')}>
                      <a href={`/student/academic/student/campaign/activity/${encodeURIComponent(a.id)}`} class="text-primary hover:underline">{semesterLabel(a)}</a>
                    </TableCell>
                    <TableCell label={t('st.sksSemester')}>{a.total_credit}</TableCell>
                    <TableCell label={t('st.semesterIPS')}>{dec(a.cumulative_index)}</TableCell>
                    <TableCell label={t('st.cumSKS')}>{a.grand_total_credit}</TableCell>
                    <TableCell label={t('st.ipk')}>{dec(a.grand_cumulative_index)}</TableCell>
                    <TableCell label={t('st.status')}><StatusBadge name={a.status_name} /></TableCell>
                    <TableCell label={t('st.lockStatus')}>
                      <LockStatus locked={a.is_lock} />
                    </TableCell>
                    <TableCell class="text-end">
                      <span class="inline-flex flex-wrap justify-end gap-x-4 gap-y-1 text-sm font-medium">
                        <Show when={!a.is_lock}>
                          <a href={`/student/academic/student/campaign/activity/${encodeURIComponent(a.id)}/enrollment`} class="text-primary hover:underline">{t('st.enrollKRS')}</a>
                        </Show>
                        <PrintLink href={printHref('krs', a)} label={t('st.krs')} title={t('st.printKRS')} />
                        <PrintLink href={printHref('khs', a)} label={t('st.khs')} title={t('st.printKHS')} />
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager
          page={data().activities?.pagination.page ?? 1}
          totalPages={data().activities?.pagination.total_page ?? 1}
          search={search as Query}
        />
      </div>
    </Errored>
  );
}
