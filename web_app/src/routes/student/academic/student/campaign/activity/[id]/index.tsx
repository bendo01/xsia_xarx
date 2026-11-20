import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import ActivityError from '../../../../../../../components/student/ActivityError';
import PageHeader from '../../../../../../../components/student/PageHeader';
import LockStatus from '../../../../../../../components/student/LockStatus';
import PrintLink from '../../../../../../../components/student/PrintLink';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../../components/ui/table';
import { formatNumber, t } from '../../../../../../../i18n';
import { getActivityDetail } from '../../../../../../../lib/enrollment';
import { gradeTone, semesterIps, totalCredits, type GradeTone } from '../../../../../../../lib/enrollment-rules';
import { lecturerLabel } from '../../../../../../../lib/enrollment-build';

export const route = {
  preload: ({ params }) => {
    void getActivityDetail(params.id as string);
  },
} satisfies RouteDefinition;

const dec = (n: number | null | undefined) => formatNumber(n ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TONE: Record<GradeTone, string> = {
  none: 'bg-muted text-muted-foreground',
  a: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  b: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  c: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  d: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  e: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

function Stat(props: { label: string; value: string }) {
  return (
    <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs">
      <p class="text-xs font-medium uppercase text-muted-foreground-1">{props.label}</p>
      <p class="mt-1 text-2xl font-semibold text-foreground">{props.value}</p>
    </div>
  );
}

/** One semester: the courses on the study plan with marks and grades, plus the semester summary. */
export default function ActivityDetailPage() {
  const params = useParams();
  const data = createMemo(() => getActivityDetail(params.id as string));

  const title = () =>
    data().activity.academic_year?.name ?? data().activity.academic_year_name ?? data().activity.name ?? t('st.academicActivityDetail');
  const printHref = (kind: 'krs' | 'khs') =>
    `/api/student/print/${kind}/${encodeURIComponent(data().activity.id)}?name=${encodeURIComponent(`${kind.toUpperCase()}_${title()}`)}`;
  const credits = () => totalCredits(data().courses);

  return (
    <Errored fallback={(err) => <ActivityError error={err()} fallbackKey="st.failedToLoadSemesterCourseDetails" />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={title()}
        description={t('st.studyPlanCardKRSAcademicGrade')}
        actions={
          <>
            <a href="/student/academic/student/campaign/activity" class="rounded-xs border border-layer-line bg-layer px-3 py-2 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden">
              {t('st.backToActivities')}
            </a>
            <PrintLink variant="button" href={printHref('krs')} label={t('st.printKRS')} title={t('st.printStudyPlanCardKRS')} />
            <PrintLink variant="button" href={printHref('khs')} label={t('st.printKHS')} title={t('st.printStudyResultCardKHS')} />
            <Show
              when={!data().activity.is_lock}
              fallback={
                <span title={t('st.academicActivityIsLocked')} class="cursor-not-allowed rounded-xs bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {t('st.addEnrollCourses')}
                </span>
              }
            >
              <a href={`/student/academic/student/campaign/activity/${encodeURIComponent(data().activity.id)}/enrollment`} class="rounded-xs bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-hidden">
                {t('st.addEnrollCourses')}
              </a>
            </Show>
          </>
        }
      />

      <section class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t('st.enrolledCourses')} value={String(data().courses.length)} />
        <Stat label={t('st.semesterSKSTaken')} value={`${credits()} ${t('st.sks')}`} />
        <Stat label={t('st.semesterGPAIPS')} value={dec(semesterIps(data().activity.cumulative_index, data().courses))} />
        <Stat label={t('st.cumulativeGPAIPK')} value={dec(data().activity.grand_cumulative_index || semesterIps(data().activity.cumulative_index, data().courses))} />
      </section>

      <section class="rounded-xs border border-card-line bg-card shadow-2xs">
        <div class="flex items-center justify-between border-b border-card-line px-5 py-4">
          <h2 class="font-semibold text-foreground">{t('st.enrolledCoursesListRencanaHasilStudi')}</h2>
          <p class="text-sm text-muted-foreground-1">{t('st.total')} {data().courses.length}</p>
        </div>
        <Show
          when={data().courses.length > 0}
          fallback={<p class="p-8 text-center text-sm text-muted-foreground-1">{t('academic.noCoursesEnrolled')}</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('academic.no')}</TableHead>
                <TableHead>{t('academic.courseCode')}</TableHead>
                <TableHead>{t('academic.courseTitle')}</TableHead>
                <TableHead>{t('academic.sks')}</TableHead>
                <TableHead>{t('academic.lecturer')}</TableHead>
                <TableHead>{t('academic.mark')}</TableHead>
                <TableHead>{t('academic.grade')}</TableHead>
                <TableHead>{t('academic.point')}</TableHead>
                <TableHead>{t('academic.status')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().courses}>
                {(c, i) => (
                  <TableRow>
                    <TableCell label={t('academic.no')}>{i() + 1}</TableCell>
                    <TableCell class="font-mono font-semibold text-primary" label={t('academic.courseCode')}>{c.course_code}</TableCell>
                    <TableCell class="font-medium" label={t('academic.courseTitle')}>{c.course_name}</TableCell>
                    <TableCell label={t('academic.sks')}>{c.credit}</TableCell>
                    <TableCell label={t('academic.lecturer')}>
                      <Show when={c.lecturers.length > 0} fallback="-">
                        <ul class="space-y-0.5">
                          <For each={c.lecturers}>{(l) => <li>{lecturerLabel(l)}</li>}</For>
                        </ul>
                      </Show>
                    </TableCell>
                    <TableCell label={t('academic.mark')}>{c.mark != null ? c.mark.toFixed(1) : '-'}</TableCell>
                    <TableCell label={t('academic.grade')}>
                      <span class={['inline-block rounded-xs px-2 py-0.5 text-xs font-bold', TONE[gradeTone(c.grade_letter)]]}>{c.grade_letter}</span>
                    </TableCell>
                    <TableCell class="font-mono font-semibold" label={t('academic.point')}>{c.grade_point != null ? c.grade_point.toFixed(2) : '-'}</TableCell>
                    <TableCell label={t('academic.status')}>
                      <LockStatus locked={c.is_lock} />
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
      </section>
    </Errored>
  );
}
