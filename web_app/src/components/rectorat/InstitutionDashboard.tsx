import { For, Show, createMemo } from 'solid-js';

import { formatNumber, t } from '../../i18n';
import { deltaOf, nonZero, periodLabel, totalsPerCategory, withOthers } from '../../lib/analytics';
import type { getInstitutionAnalytics } from '../../lib/institution-data';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { ChartCard, RankCard, TrendCard } from '../chart/ChartPanels';
import Kpi from '../chart/Kpi';

type Data = Awaited<ReturnType<typeof getInstitutionAnalytics>>;
type Row = Data['programs'][number];

const gpaClass = (g: number) => (g >= 3.5 ? 'text-emerald-600 dark:text-emerald-400' : g >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400');
const dec = (n: number) => formatNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** One KPI of the headline row (no period comparison). */
function Headline(props: { label: string; value: string; caption?: string }) {
  return <Kpi label={props.label} value={props.value} caption={props.caption} />;
}

/**
 * The rectorat's executive view: headline numbers, program comparison charts, institution-wide trends,
 * and a searchable program table. Selecting a program (the Detail link) shows its own dashboard below.
 */
export default function InstitutionDashboard(props: {
  institutionId: string;
  data: Data;
  statuses: { name: string; value: number }[];
  query: string;
  selectedId: string;
  /** The selected program's dashboard panel, rendered by the page (it loads separately). Read once only. */
  children?: any;
}) {
  const d = () => props.data;
  const programs = () => d().programs;
  const students = () => deltaOf(nonZero(totalsPerCategory(d().studentTrend)));
  const registrants = () => deltaOf(nonZero(totalsPerCategory(d().registrantTrend)));
  const gpa = () => deltaOf(nonZero(d().gpaTrend?.series[0]?.values ?? []));
  const lastLabel = (l: { categories: string[] } | null) => periodLabel(l?.categories.at(-1));
  const filtered = createMemo(() => {
    const q = props.query.toLowerCase().trim();
    return programs().filter((p) => !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q));
  });
  const ranked = (pick: (p: Row) => number) => programs().map((p) => ({ name: p.name, value: pick(p) })).filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
  const href = () => `/rectorat/institution/${encodeURIComponent(props.institutionId)}`;

  return (
    <div class="space-y-6">
      <Show when={d().failed > 0}>
        <p role="status" class="rounded-xs border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {t('rt.analyticsPartial', { failed: d().failed, total: d().totals.programs })}
        </p>
      </Show>

      <section class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Headline label={t('rt.totalProdi')} value={formatNumber(d().totals.programs)} caption={`${d().totals.active} ${t('rt.aktif').toLowerCase()}`} />
        <Headline label={t('rt.totalMahasiswa')} value={formatNumber(d().totals.students)} />
        <Headline label={t('rt.totalMatakuliah')} value={formatNumber(d().totals.courses)} />
        <Headline label={t('rt.totalSKS')} value={formatNumber(d().totals.credits)} />
        <Headline label={t('rt.rataRataIPK')} value={d().totals.gpa === null ? '-' : dec(d().totals.gpa as number)} />
        <Headline label={t('rt.prodiAktif')} value={formatNumber(d().totals.active)} caption={t('rt.ofTotalStudyPrograms', { total: d().totals.programs })} />
      </section>

      <Show when={students() || registrants() || gpa() || d().totals.lecturers > 0}>
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Show when={students()}>{(x) => <Kpi label={t('cd.kpiStudents')} value={formatNumber(x().latest)} caption={lastLabel(d().studentTrend)} delta={x()} />}</Show>
          <Show when={registrants()}>{(x) => <Kpi label={t('cd.kpiNewStudents')} value={formatNumber(x().latest)} caption={lastLabel(d().registrantTrend)} delta={x()} />}</Show>
          <Show when={gpa()}>{(x) => <Kpi label={t('cd.kpiAverageGpa')} value={dec(x().latest)} caption={lastLabel(d().gpaTrend)} delta={x()} decimals={2} />}</Show>
          <Show when={d().totals.lecturers > 0}><Kpi label={t('cd.kpiLecturers')} value={formatNumber(d().totals.lecturers)} /></Show>
        </section>
      </Show>

      <div class="grid gap-6 lg:grid-cols-2">
        <RankCard title={t('rt.jumlahMahasiswaPerProdi')} hint={t('rt.studentsPerProgram')} items={ranked((p) => p.students)} kind="bar" />
        <RankCard title={t('rt.distribusiMahasiswa')} hint={t('rt.proporsiMahasiswaAntarProgramStudi')} items={withOthers(ranked((p) => p.students), 7, t('rt.others'))} />
        <RankCard title={t('rt.jumlahMatakuliahPerProdi')} hint={t('rt.totalMatakuliahAktifDalamKurikulum')} items={ranked((p) => p.courses)} kind="bar" />
        <RankCard title={t('rt.rataRataIPKPerProdi')} hint={t('rt.ipkTerakhirTercatatPerProgramStudi')} items={ranked((p) => p.gpa ?? 0)} kind="bar" yMax={4} decimals={2} />
        <RankCard title={t('rt.studentsPerStatus')} items={props.statuses} />
        <TrendCard title={t('cd.studentTrendByAcademicYear')} line={d().studentTrend} />
        <TrendCard title={t('cd.registeredStudentByGenderTrend')} line={d().registrantTrend} />
        <TrendCard title={t('cd.averageGPAIPKTrend')} line={d().gpaTrend} kind="line" yMax={4} decimals={2} />
        <RankCard title={t('cd.courseCategoryDistribution')} items={d().courseCategories} />
        <RankCard title={t('cd.lecturerAcademicGroup')} items={d().lecturerGroups} />
        <RankCard title={t('cd.lecturerAcademicRankHomebase')} items={d().lecturerRanks} kind="bar" />
      </div>

      <section class="space-y-3">
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 class="font-semibold text-foreground">{t('rt.ringkasanSemuaProgramStudi')}</h2>
            <p class="text-xs text-muted-foreground-1">{t('rt.klikBarisUntukMelihatDetailDashboard')}</p>
          </div>
          <form method="get" class="flex items-center gap-2">
            <input type="search" name="q" value={props.query} placeholder={t('rt.cariProdi')} class="h-9 min-w-0 rounded-xs border border-layer-line bg-layer px-3 text-sm" />
            <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          </form>
        </div>
        <Show when={filtered().length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('rt.tidakAdaProgramStudiDitemukan')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('rt.kode')}</TableHead>
                <TableHead>{t('rt.programStudi')}</TableHead>
                <TableHead>{t('rt.jenjang')}</TableHead>
                <TableHead class="text-end">{t('rt.mahasiswa')}</TableHead>
                <TableHead class="text-end">{t('rt.mk')}</TableHead>
                <TableHead class="text-end">{t('rt.sks')}</TableHead>
                <TableHead class="text-end">{t('rt.ipk2')}</TableHead>
                <TableHead>{t('rt.status')}</TableHead>
                <TableHead class="text-end">{t('rt.detail')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={filtered()}>
                {(p) => (
                  <TableRow class={p.id === props.selectedId ? 'bg-primary-50 dark:bg-primary-950/30' : ''}>
                    <TableCell class="font-mono text-xs" label={t('rt.kode')}>{p.code || '-'}</TableCell>
                    <TableCell class="font-medium" label={t('rt.programStudi')}>
                      {p.name}
                      <Show when={p.parent}><span class="block text-xs font-normal text-muted-foreground-1">{p.parent}</span></Show>
                    </TableCell>
                    <TableCell label={t('rt.jenjang')}>{p.education || '-'}</TableCell>
                    <TableCell class="text-end tabular-nums" label={t('rt.mahasiswa')}>{formatNumber(p.students)}</TableCell>
                    <TableCell class="text-end tabular-nums" label={t('rt.mk')}>{p.loaded ? formatNumber(p.courses) : '-'}</TableCell>
                    <TableCell class="text-end tabular-nums" label={t('rt.sks')}>{p.loaded ? formatNumber(p.credits) : '-'}</TableCell>
                    <TableCell class="text-end" label={t('rt.ipk2')}>
                      <Show when={p.gpa !== null} fallback="-"><span class={['font-semibold tabular-nums', gpaClass(p.gpa as number)]}>{dec(p.gpa as number)}</span></Show>
                    </TableCell>
                    <TableCell label={t('rt.status')}><Badge variant={p.active ? 'success' : 'secondary'}>{p.active ? t('rt.aktif') : t('rt.tidakAktif')}</Badge></TableCell>
                    <TableCell class="text-end">
                      <Show when={p.loaded} fallback="-">
                        <a href={`${href()}?program=${encodeURIComponent(p.id)}#program-detail`} class="text-sm font-medium text-primary hover:underline">{t('rt.detail')}</a>
                      </Show>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
      </section>

      <Show when={props.selectedId}>
        <section id="program-detail" class="space-y-4 scroll-mt-20">
          <ChartCard title={t('rt.detailProgramStudi')}>
            <p class="text-sm text-muted-foreground-1">
              {programs().find((p) => p.id === props.selectedId)?.name}
              {' · '}
              <a href={`/rectorat/institution/${encodeURIComponent(props.institutionId)}/unit/${encodeURIComponent(props.selectedId)}`} class="text-primary hover:underline">{t('cd.unitDashboard')}</a>
            </p>
          </ChartCard>
          {props.children}
        </section>
      </Show>
    </div>
  );
}
