import { Show, For } from 'solid-js';

import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatDate, formatNumber, t } from '../../i18n';
import { fullName } from '../../lib/student-select';
import { creditTrend, summarize } from '../../lib/lecturer-teach';
import type { LecturerRecord } from '../../lib/lecturer-types';
import LineChart from '../chart/LineChart';

const card = 'rounded-xs border border-card-line bg-card shadow-2xs';
const date = (d?: string | null) => (d ? formatDate(d) : '-');

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

export interface ProfileIndividual {
  name: string;
  front_title?: string | null;
  last_title?: string | null;
  birth_date?: string;
  birth_place?: string;
}

/** Identity header, stats and overview / biodata / academic tabs for a lecturer. */
export default function LecturerProfileView(props: {
  individual: ProfileIndividual;
  refs?: { gender?: string | null; religion?: string | null };
  emails?: { id: string; value: string }[];
  phones?: { id: string; value: string }[];
  lecturer: LecturerRecord | null;
}) {
  const l = () => props.lecturer;
  const sum = () => summarize(l()?.assigned_teaches ?? []);
  const trend = () => creditTrend(l()?.assigned_teaches ?? [], t('lc.tahunAkademik'));
  const homebase = () => l()?.homebases[0];

  return (
    <div class="space-y-6">
      <section class={`${card} p-5`}>
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex min-w-0 max-w-full items-center gap-4">
            <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground" aria-hidden="true">
              {props.individual.name.slice(0, 1).toUpperCase()}
            </div>
            <div class="min-w-0">
              <h1 class="break-words text-xl font-semibold text-foreground sm:truncate">{fullName(props.individual)}</h1>
              <Show when={l()}>
                {(r) => (
                  <p class="mt-0.5 text-sm text-muted-foreground-1">
                    {t('lc.nidn2')} {r().nidn || r().code} · {homebase()?.unit_name ?? r().unit_name ?? '-'}
                  </p>
                )}
              </Show>
            </div>
          </div>
          <Show when={homebase()?.status_name ?? l()?.status_name}>
            {(s) => <Badge variant="outline" class="rounded-full">{s()}</Badge>}
          </Show>
        </div>
      </section>

      <Show when={l()} fallback={<p class={`${card} p-8 text-center text-sm text-muted-foreground-1`}>{t('lc.noLecturerRecord')}</p>}>
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label={t('lc.assignedClasses')} value={formatNumber(sum().classes)} />
          <Stat label={t('lc.totalSKSCredits')} value={formatNumber(sum().credits)} />
          <Stat label={t('lc.academicRank')} value={l()!.academic_ranks[0]?.rank_name ?? l()!.rank_name ?? '-'} />
          <Stat label={t('lc.academicGroup')} value={l()!.academic_groups[0]?.group_name ?? l()!.group_name ?? '-'} />
        </section>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t('lc.tabOverview')}</TabsTrigger>
            <TabsTrigger value="biodata">{t('lc.tabBiodata')}</TabsTrigger>
            <TabsTrigger value="academic">{t('lc.tabAcademic')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <section class={`${card} p-5`}>
              <h2 class="mb-3 font-semibold text-foreground">{t('lc.totalTeachingCreditsPerAcademicYear')}</h2>
              <Show when={trend().length > 0} fallback={<p class="py-12 text-center text-sm text-muted-foreground-1">{t('lc.belumAdaDataPenugasanPerkuliahanDengan')}</p>}>
                <LineChart
                  categories={trend().map((y) => y.yearName)}
                  series={[{ name: t('lc.sks'), color: '#6366f1', values: trend().map((y) => y.credits), area: true }]}
                  format={(n) => `${formatNumber(n)} ${t('lc.sks')}`}
                  tickFormat={(n) => formatNumber(n)}
                  ariaLabel={t('lc.totalTeachingCreditsPerAcademicYear')}
                />
              </Show>
              <p class="mt-3 text-sm"><a href="/lecturer/academic/campaign/transaction/teach" class="text-primary hover:underline">{t('menu.lecturer.teachingActivities')}</a></p>
            </section>
          </TabsContent>

          <TabsContent value="biodata">
            <section class={`${card} px-5 py-2`}>
              <dl class="divide-y divide-card-divider">
                <Field label={t('common.name')} value={fullName(props.individual)} />
                <Field
                  label={t('lc.birthPlaceDate')}
                  value={[props.individual.birth_place, props.individual.birth_date ? formatDate(props.individual.birth_date) : ''].filter(Boolean).join(', ')}
                />
                <Field label={t('lc.gender')} value={props.refs?.gender} />
                <Field label={t('lc.religion')} value={props.refs?.religion} />
                <For each={props.emails ?? []}>{(e) => <Field label={t('lc.emailAddress')} value={e.value} />}</For>
                <For each={props.phones ?? []}>{(p) => <Field label={t('lc.phoneNumber')} value={p.value} />}</For>
              </dl>
            </section>
          </TabsContent>

          <TabsContent value="academic">
            <div class="space-y-6">
              <section class={`${card} px-5 py-2`}>
                <dl class="divide-y divide-card-divider">
                  <Field label={t('lc.nidn')} value={l()!.nidn || l()!.code} />
                  <Field label={t('lc.nuptk')} value={l()!.nuptk} />
                  <Field label={t('lc.studyProgramUnit')} value={homebase()?.unit_name ?? l()!.unit_name} />
                  <Field label={t('lc.academicStatus')} value={homebase()?.status_name ?? l()!.status_name} />
                  <Field label={t('lc.contractAgreement')} value={homebase()?.contract_name ?? l()!.contract_name} />
                </dl>
              </section>
              <HistorySection title={t('lc.academicRank')} rows={l()!.academic_ranks.map((r) => ({ id: r.id, name: r.rank_name, decree: r.decree_number, start: r.start_date, end: r.end_date }))} />
              <HistorySection title={t('lc.academicGroup')} rows={l()!.academic_groups.map((g) => ({ id: g.id, name: g.group_name, decree: g.decree_number, start: g.start_date, end: g.end_date }))} />
            </div>
          </TabsContent>
        </Tabs>
      </Show>
    </div>
  );
}

export interface HistoryRow {
  id: string;
  name?: string | null;
  decree?: string | null;
  start?: string | null;
  end?: string | null;
}

export function HistorySection(props: { title: string; rows: HistoryRow[] }) {
  return (
    <section class={card}>
      <div class="border-b border-card-line px-5 py-4">
        <h2 class="font-semibold text-foreground">{props.title}</h2>
      </div>
      <Show when={props.rows.length > 0} fallback={<p class="p-6 text-center text-sm text-muted-foreground-1">{t('lc.noHistoryRecords')}</p>}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{props.title}</TableHead>
              <TableHead>{t('lc.decreeNumber')}</TableHead>
              <TableHead>{t('lc.startDate')}</TableHead>
              <TableHead>{t('lc.endDate')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={props.rows}>
              {(r) => (
                <TableRow>
                  <TableCell class="font-medium" label={props.title}>{r.name ?? '-'}</TableCell>
                  <TableCell label={t('lc.decreeNumber')}>{r.decree ?? '-'}</TableCell>
                  <TableCell label={t('lc.startDate')}>{date(r.start)}</TableCell>
                  <TableCell label={t('lc.endDate')}>{r.end ? date(r.end) : t('lc.currentlyActive')}</TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
    </section>
  );
}
