import { Show, createMemo } from 'solid-js';

import { formatNumber, t } from '../../i18n';
import { deltaOf } from '../../lib/analytics';
import { slicesSpec } from '../../lib/chart-specs';
import { completionRate, courseSlices, creditSlices, yearStats } from '../../lib/lecturer-teach';
import type { AssignedTeach } from '../../lib/lecturer-types';
import ChartJs from '../chart/ChartJs';
import Kpi from '../chart/Kpi';

const card = 'min-w-0 rounded-xs border border-card-line bg-card p-5 shadow-2xs';

/** The lecturer's teaching load over the academic years: headline numbers and charts. */
export default function TeachingAnalytics(props: { items: AssignedTeach[]; kpis?: boolean }) {
  const years = createMemo(() => yearStats(props.items, t('lc.tahunAkademik')));
  const labels = () => years().map((y) => y.yearName);
  const sks = (n: number) => `${formatNumber(n)} ${t('lc.sks')}`;
  const planned = () => years().reduce((s, y) => s + y.planned, 0);
  const realized = () => years().reduce((s, y) => s + y.realized, 0);
  const rate = () => completionRate(planned(), realized());
  const yearRates = () => years().map((y) => completionRate(y.planned, y.realized)).filter((r): r is number => r !== null);
  const last = () => years().at(-1);
  const courses = () => new Set(props.items.map((a) => a.course_id)).size;
  const rankings = createMemo(() => courseSlices(props.items));
  const weights = createMemo(() => creditSlices(props.items, t('lc.sks')));
  const barHeight = () => Math.min(420, 60 + rankings().length * 28);

  return (
    <Show when={years().length > 0}>
      <Show when={props.kpis}>
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Kpi label={t('lc.assignedClasses')} value={formatNumber(props.items.length)} caption={last()?.yearName} delta={deltaOf(years().map((y) => y.classes))} />
          <Kpi label={t('lc.totalSKSCredits')} value={formatNumber(years().reduce((s, y) => s + y.credits, 0))} caption={last() ? `${sks(last()!.credits)} · ${last()!.yearName}` : undefined} delta={deltaOf(years().map((y) => y.credits))} />
          <Kpi label={t('lc.completionRate')} value={rate() === null ? '-' : `${rate()}%`} caption={`${formatNumber(realized())} / ${formatNumber(planned())} ${t('lc.sessions').toLowerCase()}`} delta={deltaOf(yearRates())} />
          <Kpi label={t('lc.coursesTaught')} value={formatNumber(courses())} />
        </section>
      </Show>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class={card}>
          <h2 class="mb-3 font-semibold">{t('lc.totalTeachingCreditsPerAcademicYear')}</h2>
          <ChartJs
            ariaLabel={t('lc.totalTeachingCreditsPerAcademicYear')}
            spec={{
              kind: 'bar',
              labels: labels(),
              format: sks,
              format1: (n) => formatNumber(n),
              datasets: [
                { label: t('lc.sks'), data: years().map((y) => y.credits), color: '#6366f1' },
                { label: t('lc.assignedClasses'), data: years().map((y) => y.classes), type: 'line', axis: 'y1', color: '#f59e0b' },
              ],
            }}
          />
        </section>
        <section class={card}>
          <h2 class="mb-3 font-semibold">{t('lc.plannedVsRealized')}</h2>
          <ChartJs
            ariaLabel={t('lc.plannedVsRealized')}
            spec={{
              kind: 'bar',
              labels: labels(),
              format: (n) => formatNumber(n),
              datasets: [
                { label: t('lc.plannedSessions'), data: years().map((y) => y.planned), color: '#94a3b8' },
                { label: t('lc.realizedSessions'), data: years().map((y) => y.realized), color: '#0d9488' },
              ],
            }}
          />
        </section>
        <Show when={weights().length > 0}>
          <section class={card}>
            <h2 class="mb-3 font-semibold">{t('lc.classesByCredit')}</h2>
            <ChartJs ariaLabel={t('lc.classesByCredit')} height={220} spec={slicesSpec(weights(), 'doughnut', { format: (n) => formatNumber(n), label: t('lc.classesByCredit') })} />
          </section>
        </Show>
        <Show when={rankings().length > 0}>
          <section class={card}>
            <h2 class="mb-3 font-semibold">{t('lc.mostTaughtCourses')}</h2>
            <ChartJs ariaLabel={t('lc.mostTaughtCourses')} height={barHeight()} spec={slicesSpec(rankings(), 'bar', { format: (n) => formatNumber(n), label: t('lc.assignedClasses') })} />
          </section>
        </Show>
      </div>
    </Show>
  );
}
