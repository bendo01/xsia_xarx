import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import LineChart from '../../../../../../components/chart/LineChart';
import PageHeader from '../../../../../../components/student/PageHeader';
import { Badge } from '../../../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { formatNumber, t } from '../../../../../../i18n';
import { getMyLecturer } from '../../../../../../lib/lecturer';
import { creditTrend, creditOf, distinctYears, filterTeaches, progressPercent, summarize } from '../../../../../../lib/lecturer-teach';
import type { AssignedTeach } from '../../../../../../lib/lecturer-types';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export const route = {
  preload: () => {
    void getMyLecturer();
  },
} satisfies RouteDefinition;

const base = '/lecturer/academic/campaign/transaction/teach';
const className = (a: AssignedTeach) => a.class_name || `${t('lc.classCode')} ${a.class_alphabet_code ?? ''}`.trim();
const card = 'rounded-xs border border-card-line bg-card shadow-2xs';

function Stat(props: { label: string; value: string }) {
  return (
    <div class={`${card} p-4`}>
      <p class="text-xs font-medium uppercase text-muted-foreground-1">{props.label}</p>
      <p class="mt-1 text-2xl font-semibold text-foreground">{props.value}</p>
    </div>
  );
}

function ClassActions(props: { a: AssignedTeach }) {
  const link = 'text-sm font-medium text-primary hover:underline';
  return (
    <span class="inline-flex flex-wrap justify-end gap-x-4 gap-y-1">
      <a href={`${base}/${encodeURIComponent(props.a.teach_id)}/attendance`} class={link}>{t('lc.presensi')}</a>
      <a href={`${base}/${encodeURIComponent(props.a.teach_id)}/grade`} class={link}>{t('lc.nilai2')}</a>
    </span>
  );
}

function Sessions(props: { a: AssignedTeach }) {
  return (
    <div class="min-w-32">
      <p class="text-sm">{props.a.realization} / {props.a.planning || 16}</p>
      <div class="mt-1 h-1.5 w-full overflow-hidden rounded-xs bg-muted" role="progressbar" aria-valuenow={progressPercent(props.a)} aria-valuemin="0" aria-valuemax="100">
        <div class="h-full bg-primary" style={{ width: `${progressPercent(props.a)}%` }} />
      </div>
    </div>
  );
}

/** Classes assigned to the signed-in lecturer, with credit trend, filters and attendance/grade links. */
export default function LecturerTeachIndex() {
  const [search] = useSearchParams();
  const data = createMemo(() => getMyLecturer());
  const refreshing = () => isPending(() => data());
  const all = () => data().lecturer?.assigned_teaches ?? [];
  const years = createMemo(() => distinctYears(all(), t('lc.tahunAkademik')));
  const rows = createMemo(() => filterTeaches(all(), one((search as Query).q), one((search as Query).year)));
  const sum = createMemo(() => summarize(all()));
  const trend = createMemo(() => creditTrend(all(), t('lc.tahunAkademik')));
  const filtered = () => one((search as Query).q) !== '' || ['', 'all'].indexOf(one((search as Query).year)) < 0;

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('lc.failedToLoadLecturerData')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('lc.assignedTeachingClasses')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader
          title={t('lc.assignedTeachingClasses')}
          description={`${t('lc.nidn2')} ${data().lecturer?.nidn || data().lecturer?.code || '-'} · ${data().lecturer?.name || data().name || ''}`}
          actions={<a href="/lecturer/person/master/individual/[id]/show" class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('lc.facultyProfile')}</a>}
        />

        <Show
          when={data().lecturer}
          fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('lc.noLecturerRecord')}</p>}
        >
          <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label={t('lc.assignedClasses')} value={formatNumber(sum().classes)} />
            <Stat label={t('lc.totalSKSCredits')} value={formatNumber(sum().credits)} />
            <Stat label={t('lc.plannedSessions')} value={formatNumber(sum().planned)} />
            <Stat label={t('lc.realizedSessions')} value={formatNumber(sum().realized)} />
          </section>

          <Show when={trend().length > 0}>
            <section class={`${card} p-4`}>
              <h2 class="text-sm font-semibold">{t('lc.totalTeachingCreditsPerAcademicYear')}</h2>
              <LineChart
                categories={trend().map((y) => y.yearName)}
                series={[{ name: t('lc.sks'), color: '#6366f1', values: trend().map((y) => y.credits), area: true }]}
                format={(n) => `${formatNumber(n)} ${t('lc.sks')}`}
                tickFormat={(n) => formatNumber(n)}
                ariaLabel={t('lc.totalTeachingCreditsPerAcademicYear')}
              />
            </section>
          </Show>

          <form method="get" class="flex flex-wrap items-center gap-2">
            <input
              type="search"
              name="q"
              value={one((search as Query).q)}
              placeholder={t('lc.searchCourseTitleCourseCodeE')}
              class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm"
            />
            <select name="year" class="h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm">
              <option value="all" selected={!one((search as Query).year) || one((search as Query).year) === 'all'}>{t('lc.semuaTahunAkademik')}</option>
              <For each={years()}>{(y) => <option value={y.id} selected={one((search as Query).year) === y.id}>{y.name}</option>}</For>
            </select>
            <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('common.search')}</button>
            <Show when={filtered()}>
              <a href={base} class="text-sm text-primary hover:underline">{t('lc.clearFilters')}</a>
            </Show>
          </form>

          <Show
            when={rows().length > 0}
            fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('lc.noTeachingClassesFound')}</p>}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('lc.courseCodeName')}</TableHead>
                  <TableHead>{t('lc.classSection')}</TableHead>
                  <TableHead>{t('lc.sks')}</TableHead>
                  <TableHead>{t('lc.teachingSessions')}</TableHead>
                  <TableHead>{t('lc.homebase')}</TableHead>
                  <TableHead class="text-end">{t('lc.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={rows()}>
                  {(a) => (
                    <TableRow>
                      <TableCell class="font-medium" label={t('lc.courseCodeName')}>
                        <span class="block font-mono text-xs text-muted-foreground-1">{a.course_code}{a.academic_year_name ? ` · ${a.academic_year_name}` : ''}</span>
                        {a.course_name}
                      </TableCell>
                      <TableCell label={t('lc.classSection')}>{className(a)}</TableCell>
                      <TableCell label={t('lc.sks')}>{creditOf(a)}</TableCell>
                      <TableCell label={t('lc.teachingSessions')}><Sessions a={a} /></TableCell>
                      <TableCell label={t('lc.homebase')}>
                        <Show when={a.is_lecturer_home_base} fallback="-"><Badge variant="success">{t('lc.homebase')}</Badge></Show>
                      </TableCell>
                      <TableCell class="text-end"><ClassActions a={a} /></TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </Show>
      </div>
    </Errored>
  );
}
