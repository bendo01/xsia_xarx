import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import BarList from '../../../../../../components/chart/BarList';
import LineChart from '../../../../../../components/chart/LineChart';
import PageHeader from '../../../../../../components/student/PageHeader';
import { Badge } from '../../../../../../components/ui/badge';
import { formatDate, formatNumber, t } from '../../../../../../i18n';
import { getUnitDashboard } from '../../../../../../lib/unit';
import { lineFromOption, rowsFromDataset, slicesFromOption } from '../../../../../../lib/unit-dashboard';

export const route = {
  preload: ({ params }) => {
    void getUnitDashboard(params.id as string);
  },
} satisfies RouteDefinition;

const card = 'rounded-xs border border-card-line bg-card shadow-2xs';
const COLORS = ['#6366f1', '#0ea5e9', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6'];

function Stat(props: { label: string; value: string }) {
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

function Panel(props: { title: string; wide?: boolean; children: any }) {
  return (
    <section class={`${card} min-w-0 p-5 ${props.wide ? 'lg:col-span-2' : ''}`}>
      <h2 class="mb-3 font-semibold text-foreground">{props.title}</h2>
      {props.children}
    </section>
  );
}

function Trend(props: { title: string; option: unknown; wide?: boolean }) {
  const line = () => lineFromOption(props.option);
  return (
    <Show when={line()}>
      {(l) => (
        <Panel title={props.title} wide={props.wide}>
          <LineChart
            categories={l().categories}
            series={l().series.map((s, i) => ({ name: s.name, color: COLORS[i % COLORS.length], values: s.values, area: l().series.length === 1 }))}
            format={(n) => formatNumber(n)}
            ariaLabel={props.title}
          />
          <Show when={l().series.length > 1}>
            <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground-1">
              <For each={l().series}>
                {(s, i) => <li class="flex items-center gap-1.5"><span class="size-2 rounded-full" style={{ background: COLORS[i() % COLORS.length] }} />{s.name}</li>}
              </For>
            </ul>
          </Show>
        </Panel>
      )}
    </Show>
  );
}

function Distribution(props: { title: string; items: { name: string; value: number }[]; wide?: boolean }) {
  return (
    <Show when={props.items.length > 0}>
      <Panel title={props.title} wide={props.wide}>
        <BarList items={props.items} ariaLabel={props.title} />
      </Panel>
    </Show>
  );
}

/** Study-program dashboard: identity, totals and trend/distribution charts. */
export default function UnitDashboard() {
  const params = useParams();
  const unit = createMemo(() => getUnitDashboard(params.id as string));
  const refreshing = () => isPending(() => unit());
  const u = () => unit() as Record<string, any>;

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('cd.failedToLoadUnitDetailsFrom')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('cd.unitDashboard')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={u().name || u().nama || t('cd.unitDashboard')} description={t('cd.overviewAndDetailsOfTheSelected')} />

        <section class="grid grid-cols-2 gap-4 lg:grid-cols-3">
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
            <Field label={t('cd.createdAt') } value={u().created_at ? formatDate(u().created_at) : null} />
            <Field label={t('cd.updatedAt')} value={u().updated_at ? formatDate(u().updated_at) : null} />
          </dl>
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <Trend title={t('cd.studentTrendByAcademicYear')} option={u().student_academic_year_chart} />
          <Distribution title={t('cd.courseCategoryDistribution')} items={slicesFromOption(u().course_category_distribution)} />
          <Trend title={t('cd.registeredStudentByGenderTrend')} option={u().registered_student_academic_year_chart} wide />
          <Distribution
            title={t('cd.studentDistributionByRegion')}
            items={rowsFromDataset(u().student_regency_distribution || u().student_sub_district_distribution)}
            wide
          />
          <Trend title={t('cd.studentDistributionByReligion')} option={u().student_religion_distribution} wide />
          <Trend title={t('cd.averageGPAIPKTrend')} option={u().average_gpa_trend} wide />
          <Distribution title={t('cd.lecturerAcademicGroup')} items={slicesFromOption(u().lecturer_academic_group_distribution)} />
          <Distribution title={t('cd.lecturerAcademicRankHomebase')} items={slicesFromOption(u().lecturer_academic_rank_distribution)} />
        </div>
      </div>
    </Errored>
  );
}
