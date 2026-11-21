import { For, Show } from 'solid-js';

import { formatNumber, t } from '../../i18n';
import { lecturerLabel } from '../../lib/enrollment-build';
import { gradeTone, semesterIps, totalCredits, type GradeTone } from '../../lib/enrollment-rules';
import type { ActivityDetail } from '../../lib/enrollment-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import LockStatus from './LockStatus';

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

/** The semester summary stats and the table of enrolled courses with marks and grades. */
export default function ActivityCourses(props: { data: ActivityDetail }) {
  const credits = () => totalCredits(props.data.courses);

  return (
    <>
      <section class="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t('st.enrolledCourses')} value={String(props.data.courses.length)} />
        <Stat label={t('st.semesterSKSTaken')} value={`${credits()} ${t('st.sks')}`} />
        <Stat label={t('st.semesterGPAIPS')} value={dec(semesterIps(props.data.activity.cumulative_index, props.data.courses))} />
        <Stat label={t('st.cumulativeGPAIPK')} value={dec(props.data.activity.grand_cumulative_index || semesterIps(props.data.activity.cumulative_index, props.data.courses))} />
      </section>

      <section class="rounded-xs border border-card-line bg-card shadow-2xs">
        <div class="flex items-center justify-between border-b border-card-line px-5 py-4">
          <h2 class="font-semibold text-foreground">{t('st.enrolledCoursesListRencanaHasilStudi')}</h2>
          <p class="text-sm text-muted-foreground-1">{t('st.total')} {props.data.courses.length}</p>
        </div>
        <Show
          when={props.data.courses.length > 0}
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
              <For each={props.data.courses}>
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
    </>
  );
}
