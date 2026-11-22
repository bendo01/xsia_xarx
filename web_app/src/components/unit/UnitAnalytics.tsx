import { Show } from 'solid-js';

import { formatDate, formatNumber, t } from '../../i18n';
import { seriesSpec, slicesSpec } from '../../lib/chart-specs';
import { withData, deltaOf, nonZero, periodLabel, totalsPerCategory, trimTrailingEmpty } from '../../lib/analytics';
import { lineFromOption, rowsFromDataset, slicesFromOption } from '../../lib/unit-dashboard';
import ChartJs from '../chart/ChartJs';
import { Badge } from '../ui/badge';
import Kpi from '../chart/Kpi';

const card = 'rounded-xs border border-card-line bg-card shadow-2xs';

export function Stat(props: { label: string; value: string }) {
  return (
    <div class={`${card} p-4`}>
      <p class="text-xs font-medium uppercase text-muted-foreground-1">{props.label}</p>
      <p class="mt-1 text-2xl font-semibold text-foreground">{props.value}</p>
    </div>
  );
}

function Field(props: { label: string; value?: string | null }) {
  return (
    <div class="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt class="text-sm text-muted-foreground-1">{props.label}</dt>
      <dd class="mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0">{props.value || '-'}</dd>
    </div>
  );
}

export function Panel(props: { title: string; wide?: boolean; children: any }) {
  return (
    <section class={`${card} min-w-0 p-5 ${props.wide ? 'lg:col-span-2' : ''}`}>
      <h2 class="mb-3 font-semibold text-foreground">{props.title}</h2>
      {props.children}
    </section>
  );
}

/** A period series (status / gender / religion over time), drawn as stacked bars or a line. */
function Trend(props: { title: string; option: unknown; wide?: boolean; kind?: 'bar' | 'line'; yMax?: number; decimals?: number }) {
  const line = () => withData(trimTrailingEmpty(lineFromOption(props.option)));
  return (
    <Show when={line()}>
      {(l) => (
        <Panel title={props.title} wide={props.wide}>
          <ChartJs
            spec={seriesSpec(l(), props.kind ?? 'bar', {
              stacked: (props.kind ?? 'bar') === 'bar',
              gapZeros: props.kind === 'line',
              yMax: props.yMax,
              precision: props.decimals ?? 0,
              format: (n) => formatNumber(n, { maximumFractionDigits: props.decimals ?? 0 }),
            })}
            ariaLabel={props.title}
          />
        </Panel>
      )}
    </Show>
  );
}

function Distribution(props: { title: string; items: { name: string; value: number }[]; wide?: boolean; kind?: 'doughnut' | 'bar' }) {
  return (
    <Show when={props.items.length > 0}>
      <Panel title={props.title} wide={props.wide}>
        <ChartJs
          spec={slicesSpec(props.items, props.kind ?? 'doughnut', { format: (n) => formatNumber(n), label: props.title })}
          ariaLabel={props.title}
          height={props.kind === 'bar' ? Math.min(420, 60 + Math.min(props.items.length, 12) * 28) : 240}
        />
      </Panel>
    </Show>
  );
}

/** Study-program analytics: headline numbers with period-over-period change, identity, and charts. */
export default function UnitAnalytics(props: { unit: Record<string, any> }) {
  const u = () => props.unit;
  const students = () => {
    const l = trimTrailingEmpty(lineFromOption(u().student_academic_year_chart));
    return { l, d: deltaOf(nonZero(totalsPerCategory(l))), label: periodLabel(l?.categories[l.categories.length - 1]) };
  };
  const registrants = () => {
    const l = trimTrailingEmpty(lineFromOption(u().registered_student_academic_year_chart));
    return { d: deltaOf(nonZero(totalsPerCategory(l))), label: periodLabel(l?.categories[l.categories.length - 1]) };
  };
  const gpa = () => {
    const l = withData(trimTrailingEmpty(lineFromOption(u().average_gpa_trend)));
    const v = nonZero(l?.series[0]?.values ?? []);
    return { d: deltaOf(v), label: periodLabel(l?.categories[l.categories.length - 1]) };
  };
  const lecturers = () => slicesFromOption(u().lecturer_academic_group_distribution).reduce((s, x) => s + x.value, 0);

  return (
    <>
      <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Show when={students().d}>{(d) => <Kpi label={t('cd.kpiStudents')} value={formatNumber(d().latest)} caption={students().label} delta={d()} />}</Show>
        <Show when={registrants().d}>{(d) => <Kpi label={t('cd.kpiNewStudents')} value={formatNumber(d().latest)} caption={registrants().label} delta={d()} />}</Show>
        <Show when={gpa().d}>{(d) => <Kpi label={t('cd.kpiAverageGpa')} value={formatNumber(d().latest, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} caption={gpa().label} delta={d()} decimals={2} />}</Show>
        <Show when={lecturers() > 0}><Kpi label={t('cd.kpiLecturers')} value={formatNumber(lecturers())} /></Show>
        <Stat label={t('cd.totalCurriculum')} value={formatNumber(u().total_curriculum || 0)} />
        <Stat label={t('cd.totalCourses')} value={formatNumber(u().matakuliah?.total_matakuliah || 0)} />
        <Stat label={t('cd.totalCreditsSKS')} value={formatNumber(u().matakuliah?.total_credit || 0)} />
      </section>

      <section class={`${card} px-5 py-2`}>
        <div class="flex flex-wrap items-center justify-between gap-2 py-2">
          <span class="text-sm font-medium">{t('cd.code2')} {u().code || '-'}</span>
          <Badge variant={u().is_active ? 'success' : 'secondary'}>{u().is_active ? t('cd.active') : t('cd.inactive')}</Badge>
        </div>
        <dl class="divide-y divide-card-divider">
          <Field label={t('cd.institution')} value={u().institution?.name} />
          <Field label={t('cd.unitType')} value={u().unit_type?.name} />
          <Field label={t('cd.parentUnit')} value={u().parent?.name} />
          <Field label={t('cd.createdAt')} value={u().created_at ? formatDate(u().created_at) : null} />
          <Field label={t('cd.updatedAt')} value={u().updated_at ? formatDate(u().updated_at) : null} />
        </dl>
      </section>

      <div class="grid gap-6 lg:grid-cols-2">
        <Trend title={t('cd.studentTrendByAcademicYear')} option={u().student_academic_year_chart} />
        <Distribution title={t('cd.courseCategoryDistribution')} items={slicesFromOption(u().course_category_distribution)} />
        <Trend title={t('cd.registeredStudentByGenderTrend')} option={u().registered_student_academic_year_chart} />
        <Distribution
          title={t('cd.studentDistributionByRegion')}
          items={rowsFromDataset(u().student_regency_distribution || u().student_sub_district_distribution)}
          kind="bar"
          wide
        />
        <Trend title={t('cd.studentDistributionByReligion')} option={u().student_religion_distribution} />
        <Trend title={t('cd.averageGPAIPKTrend')} option={u().average_gpa_trend} kind="line" yMax={4} decimals={2} wide />
        <Distribution title={t('cd.lecturerAcademicGroup')} items={slicesFromOption(u().lecturer_academic_group_distribution)} />
        <Distribution title={t('cd.lecturerAcademicRankHomebase')} items={slicesFromOption(u().lecturer_academic_rank_distribution)} kind="bar" />
      </div>
    </>
  );
}
