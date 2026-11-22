import { For, Show } from 'solid-js';

import ChartJs from '../chart/ChartJs';
import Kpi from '../chart/Kpi';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { formatDate, formatNumber, t } from '../../i18n';
import { chronological } from '../../lib/academic-trend';
import { deltaOf } from '../../lib/analytics';
import { fullName, parentsOf } from '../../lib/student-select';
import type { StudentItem, StudentProfile } from '../../lib/student-types';
import LockStatus from './LockStatus';
import StatusBadge from './StatusBadge';
import StudentSwitcher from './StudentSwitcher';

type Query = Record<string, string | string[] | undefined>;
const dec = (n: number | undefined) => formatNumber(n ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const cardClass = 'rounded-xs border border-card-line bg-card shadow-2xs';

function Field(props: { label: string; value?: string | null }) {
  return (
    <div class="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt class="text-sm text-muted-foreground-1">{props.label}</dt>
      <dd class="mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0">{props.value || '-'}</dd>
    </div>
  );
}

const unitName = (s: StudentItem) => s.unit?.name ?? s.unit_name ?? '-';
const statusName = (s: StudentItem) => s.status?.name ?? s.status_name ?? '-';

/** Student profile body: identity header, student switcher, and overview / biodata / academic tabs. */
export default function StudentProfileView(props: { profile: StudentProfile; search: Query; refreshing?: () => boolean }) {
  const profile = () => props.profile;

  // The trend is oldest-first; its last point is the latest semester.
  const latest = () => profile().trend.at(-1);
  const semesters = () => profile().trend.map((p, i) => p.label || t('st.semN', { n: i + 1 }));
  /** The semester with the highest IPS (ignores semesters without grades yet). */
  const best = () => {
    const graded = profile().trend.map((p, i) => ({ ips: p.ips, label: semesters()[i] })).filter((p) => p.ips > 0);
    return graded.length ? graded.reduce((a, b) => (b.ips > a.ips ? b : a)) : null;
  };
  const parents = () => parentsOf(profile().familyCards, profile().individual.id);
  const newestFirst = () => chronological(profile().activities).reverse();

  return (
      <div class={['space-y-6 transition-opacity', { 'opacity-60': (props.refreshing?.() ?? false) }]} aria-busy={(props.refreshing?.() ?? false) ? 'true' : 'false'}>
        {/* Identity header */}
        <section class={`${cardClass} p-5`}>
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="flex min-w-0 max-w-full items-center gap-4">
              <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground" aria-hidden="true">
                {profile().individual.name.slice(0, 1).toUpperCase()}
              </div>
              <div class="min-w-0">
                <h1 class="break-words text-xl font-semibold text-foreground sm:truncate">{fullName(profile().individual)}</h1>
                <Show when={profile().selected}>
                  {(s) => (
                    <p class="mt-0.5 text-sm text-muted-foreground-1">
                      {t('st.nim2')} {s().code} · {unitName(s())}
                    </p>
                  )}
                </Show>
              </div>
            </div>
            <Show when={profile().selected}>
              {(s) => (
                <StatusBadge name={statusName(s())} />
              )}
            </Show>
          </div>

        </section>

        <StudentSwitcher students={profile().students} selectedId={profile().selected?.id} search={props.search} />

        {/* Headline numbers from the most recent semester, with the change since the one before */}
        <section class="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Kpi label={t('st.cumulativeIPK')} value={dec(latest()?.ipk)} caption={semesters().at(-1)} delta={deltaOf(profile().trend.map((p) => p.ipk))} decimals={2} />
          <Kpi label={t('st.ips2')} value={dec(latest()?.ips)} delta={deltaOf(profile().trend.map((p) => p.ips))} decimals={2} />
          <Kpi label={t('st.cumulativeSKS')} value={String(latest()?.totalSks ?? 0)} caption={`+${latest()?.sks ?? 0} ${t('st.sks')}`} />
          <Show when={best()}>
            {(b) => <Kpi label={t('st.bestSemester')} value={dec(b().ips)} caption={b().label} />}
          </Show>
          <Kpi label={t('st.semesterActivities')} value={String(profile().activities.length)} caption={`${profile().advisers.length} ${t('st.academicAdvisers')}`} />
        </section>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">{t('st.overviewAcademicHistory')}</TabsTrigger>
            <TabsTrigger value="biodata">{t('st.personalBiodataAddress')}</TabsTrigger>
            <TabsTrigger value="academic">{t('st.advisersGuidance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <section class="mb-6 grid gap-6 lg:grid-cols-2">
              <div class={`${cardClass} p-5`}>
                <h2 class="mb-3 font-semibold text-foreground">{t('st.academicPerformanceTrend')}</h2>
                <Show
                  when={profile().trend.length > 0}
                  fallback={<p class="py-12 text-center text-sm text-muted-foreground-1">{t('st.noAcademicSemesterActivityRecordsFound')}</p>}
                >
                  <ChartJs
                    ariaLabel={t('st.academicPerformanceTrend')}
                    spec={{
                      kind: 'bar',
                      labels: semesters(),
                      yMax: 4,
                      format: dec,
                      datasets: [
                        { label: t('st.ips2'), data: profile().trend.map((p) => p.ips), color: '#0ea5e9' },
                        { label: t('st.ipk'), data: profile().trend.map((p) => p.ipk), type: 'line', color: '#6366f1' },
                      ],
                    }}
                  />
                </Show>
              </div>
              <div class={`${cardClass} p-5`}>
                <h2 class="mb-3 font-semibold text-foreground">{t('st.progresBebanKreditSKS')}</h2>
                <Show
                  when={profile().trend.length > 0}
                  fallback={<p class="py-12 text-center text-sm text-muted-foreground-1">{t('st.noAcademicCreditRecordsFoundTo')}</p>}
                >
                  <ChartJs
                    ariaLabel={t('st.progresBebanKreditSKS')}
                    spec={{
                      kind: 'bar',
                      labels: semesters(),
                      format: (n) => `${formatNumber(n)} ${t('st.sks')}`,
                      format1: (n) => `${formatNumber(n)} ${t('st.sks')}`,
                      datasets: [
                        { label: t('st.semesterSKS'), data: profile().trend.map((p) => p.sks), color: '#f59e0b' },
                        { label: t('st.cumulativeSKS'), data: profile().trend.map((p) => p.totalSks), type: 'line', axis: 'y1', color: '#0d9488' },
                      ],
                    }}
                  />
                </Show>
              </div>
            </section>

            <section class={cardClass}>
              <div class="border-b border-card-line px-5 py-4">
                <h2 class="font-semibold text-foreground">{t('st.recentAcademicSemesters')}</h2>
              </div>
              <Show
                when={profile().activities.length > 0}
                fallback={<p class="p-6 text-center text-sm text-muted-foreground-1">{t('st.noAcademicSemesterActivityRecordsFound')}</p>}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('st.academicSemester')}</TableHead>
                      <TableHead>{t('st.sksSemester')}</TableHead>
                      <TableHead>{t('st.semesterIPS')}</TableHead>
                      <TableHead>{t('st.cumSKS')}</TableHead>
                      <TableHead>{t('st.ipk')}</TableHead>
                      <TableHead>{t('st.status')}</TableHead>
                      <TableHead>{t('st.lockStatus')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Newest first, as the old page listed them. */}
                    <For each={newestFirst()}>
                      {(a) => (
                        <TableRow>
                          <TableCell class="font-medium" label={t('st.academicSemester')}>
                            {a.academic_year?.name ?? a.academic_year_name ?? a.semester_name ?? a.name ?? '-'}
                          </TableCell>
                          <TableCell label={t('st.sksSemester')}>{a.total_credit}</TableCell>
                          <TableCell label={t('st.semesterIPS')}>{dec(a.cumulative_index)}</TableCell>
                          <TableCell label={t('st.cumSKS')}>{a.grand_total_credit}</TableCell>
                          <TableCell label={t('st.ipk')}>{dec(a.grand_cumulative_index)}</TableCell>
                          <TableCell label={t('st.status')}><StatusBadge name={a.status_name} /></TableCell>
                          <TableCell label={t('st.lockStatus')}>
                            <LockStatus locked={a.is_lock} />
                          </TableCell>
                        </TableRow>
                      )}
                    </For>
                  </TableBody>
                </Table>
              </Show>
            </section>
          </TabsContent>

          <TabsContent value="biodata">
            <div class="space-y-6">
            <section class={`${cardClass} px-5 py-2`}>
              <dl class="divide-y divide-card-divider">
                <Field label={t('common.name')} value={fullName(profile().individual)} />
                <Field
                  label={t('st.birthPlaceDate2')}
                  value={[profile().individual.birth_place, profile().individual.birth_date ? formatDate(profile().individual.birth_date) : '']
                    .filter(Boolean)
                    .join(', ')}
                />
                <Field label={t('st.gender')} value={profile().refs.gender} />
                <Field label={t('st.religion')} value={profile().refs.religion} />
                <For each={profile().emails}>{(e) => <Field label={t('st.email2')} value={e.value} />}</For>
                <For each={profile().phones}>{(p) => <Field label={t('st.phoneNumber')} value={p.value} />}</For>
              </dl>
            </section>

            {/* Parents / guardians, taken from the family cards */}
            <section class={cardClass}>
              <h2 class="border-b border-card-line px-5 py-3 text-sm font-semibold">{t('st.parentsGuardians')}</h2>
              <Show
                when={parents().length > 0}
                fallback={<p class="p-5 text-sm text-muted-foreground-1">{t('st.noParentData')}</p>}
              >
                <dl class="divide-y divide-card-divider px-5 py-2">
                  <For each={parents()}>{(p) => <Field label={p.relation} value={p.name} />}</For>
                </dl>
              </Show>
            </section>

            <section class={cardClass}>
              <h2 class="border-b border-card-line px-5 py-3 text-sm font-semibold">{t('ad.residencesTitle')}</h2>
              <Show when={profile().residences.length > 0} fallback={<p class="p-5 text-sm text-muted-foreground-1">{t('ad.noneRecorded')}</p>}>
                <ul class="divide-y divide-card-divider">
                  <For each={profile().residences}>
                    {(r) => (
                      <li class="space-y-0.5 px-5 py-3 text-sm">
                        <p class="font-medium">
                          {r.street || '-'}
                          <Show when={r.neighborhood_association || r.citizens_association}>
                            <span class="font-normal text-muted-foreground-1"> ({t('ad.rtRw')} {r.neighborhood_association}/{r.citizens_association})</span>
                          </Show>
                        </p>
                        <p class="text-muted-foreground-1">{[r.village_name, r.sub_district_name, r.regency_name, r.province_name].filter(Boolean).join(', ') || '-'}</p>
                        <Show when={r.residence_type_name}><p class="text-xs text-muted-foreground-1">{r.residence_type_name}</p></Show>
                      </li>
                    )}
                  </For>
                </ul>
              </Show>
            </section>

            <For each={profile().familyCards}>
              {(c) => (
                <section class={cardClass}>
                  <h2 class="border-b border-card-line px-5 py-3 text-sm font-semibold">{t('ad.familyCards')} · {t('ad.familyCardNumber')} {c.code || '-'}</h2>
                  <p class="px-5 pt-3 text-sm text-muted-foreground-1">{t('ad.familyHead')}: <span class="font-medium text-foreground">{c.head_name || '-'}</span></p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('ad.familyMember')}</TableHead>
                        <TableHead>{t('ad.familyRelationship')}</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <For each={c.members}>
                        {(m) => (
                          <TableRow>
                            <TableCell label={t('ad.familyMember')}>{m.individual_name || '-'}</TableCell>
                            <TableCell label={t('ad.familyRelationship')}>{m.relative_type_name || '-'}</TableCell>
                            <TableCell>{m.relative_name || '-'}</TableCell>
                          </TableRow>
                        )}
                      </For>
                    </TableBody>
                  </Table>
                </section>
              )}
            </For>
            </div>
          </TabsContent>

          <TabsContent value="academic">
            <div class="space-y-6">
              <Show when={profile().selected}>
                {(s) => (
                  <section class={`${cardClass} px-5 py-2`}>
                    <dl class="divide-y divide-card-divider">
                      <Field label={t('st.studentNIM')} value={s().code} />
                      <Field label={t('st.studyProgram')} value={unitName(s())} />
                      <Field label={t('st.curriculumCohort')} value={s().curriculum?.name ?? s().curriculum_name} />
                      <Field label={t('st.angkatan')} value={s().academic_year?.name ?? s().academic_year_name} />
                      <Field label={t('st.currentStatus')} value={statusName(s())} />
                    </dl>
                  </section>
                )}
              </Show>

              <section class={cardClass}>
                <div class="border-b border-card-line px-5 py-4">
                  <h2 class="font-semibold text-foreground">{t('st.assignedAcademicAdvisersCounsellors')}</h2>
                </div>
                <Show
                  when={profile().advisers.length > 0}
                  fallback={<p class="p-6 text-center text-sm text-muted-foreground-1">{t('st.noAssignedAdvisersFound')}</p>}
                >
                  <ul class="divide-y divide-card-divider">
                    <For each={profile().advisers}>
                      {(a) => (
                        <li class="flex flex-wrap items-center justify-between gap-2 px-5 py-3">
                          <div class="min-w-0">
                            <p class="truncate text-sm font-medium text-foreground">{a.lecturer_name ?? '-'}</p>
                            <p class="truncate text-xs text-muted-foreground-1">
                              {[a.lecturer_nidn, a.lecturer_email].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                          <div class="text-end text-xs text-muted-foreground-1">
                            <Show when={a.role_type}><p>{a.role_type}</p></Show>
                            <Show when={a.decree_number}>
                              <p>
                                {t('st.assignmentDecree')} {a.decree_number}
                                {a.decree_date ? ` · ${formatDate(a.decree_date)}` : ''}
                              </p>
                            </Show>
                          </div>
                        </li>
                      )}
                    </For>
                  </ul>
                </Show>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>
  );
}
