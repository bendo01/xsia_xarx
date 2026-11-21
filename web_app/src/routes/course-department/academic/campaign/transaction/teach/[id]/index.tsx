import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import ClassLockButton from '../../../../../../../components/crud/ClassLockButton';
import DeleteButton from '../../../../../../../components/crud/DeleteButton';
import PageHeader from '../../../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../../../components/ui/tabs';
import { formatNumber, t } from '../../../../../../../i18n';
import { getUnitTeach } from '../../../../../../../lib/unit';

export const route = {
  preload: ({ params }) => {
    void getUnitTeach(params.id as string);
  },
} satisfies RouteDefinition;

const card = 'rounded-xs border border-card-line bg-card shadow-2xs';
const day = (v: unknown) => (typeof v === 'string' && v ? v.slice(0, 10) : '-');

function Field(props: { label: string; value?: string | number | null }) {
  return (
    <div class="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt class="text-sm text-muted-foreground-1">{props.label}</dt>
      <dd class="mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0">{props.value ?? '-'}</dd>
    </div>
  );
}

/** A teaching class of the unit: overview, lecturers, enrolled students and evaluation components. */
export default function UnitTeachDetail() {
  const params = useParams();
  const teach = createMemo(() => getUnitTeach(params.id as string) as Promise<any> as any);
  const evals = () => ((teach().teach_evaluations ?? []) as any[]).slice().sort((a, b) => (a.thread ?? 0) - (b.thread ?? 0));
  const weight = () => evals().reduce((s, e) => s + (Number(e.evaluation_weight) || 0), 0);

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${teach().course?.name ?? teach().name ?? ''} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={`${teach().course?.code ?? ''} ${teach().course?.name ?? teach().name ?? ''}`.trim()}
        description={teach().class_code?.name}
        actions={
          <>
            <a href="/course-department/academic/campaign/transaction/teach" class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('cd.back')}</a>
            <ClassLockButton teachId={teach().id} locked={!!teach().is_lock} />
            <Show when={!teach().is_lock}>
              <a href={`/course-department/academic/campaign/transaction/teach/${encodeURIComponent(teach().id)}/edit`} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.edit')}</a>
              <DeleteButton resource="teach" id={teach().id} />
            </Show>
          </>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t('lc.tabOverview')}</TabsTrigger>
          <TabsTrigger value="lecturers">{t('cd.teachLecturers')}</TabsTrigger>
          <TabsTrigger value="students">{t('cd.teachMembers')}</TabsTrigger>
          <TabsTrigger value="evaluations">{t('cd.teachEvaluation')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <section class={`${card} px-5 py-2`}>
            <dl class="divide-y divide-card-divider">
              <Field label={t('cd.teachCourse')} value={teach().course?.name} />
              <Field label={t('cd.teachClassCode')} value={teach().class_code?.name} />
              <Field label={t('cd.fActivity')} value={teach().activity?.name} />
              <Field label={t('cd.fCredit')} value={teach().course?.total_credit} />
              <Field label={t('cd.fStartDate')} value={`${day(teach().start_date)} – ${day(teach().end_date)}`} />
              <Field label={t('cd.fCapacity')} value={teach().max_member} />
              <Field label={t('cd.teachMembers')} value={teach().enrolled_count ?? (teach().detail_activities ?? []).length} />
            </dl>
          </section>
        </TabsContent>

        <TabsContent value="lecturers">
          <p class="mb-3 text-sm"><a href={`/course-department/academic/campaign/transaction/teach/${encodeURIComponent(teach().id)}/lecturer`} class="text-primary hover:underline">{t('cd.teachLecturerList')}</a></p>
          <Show when={(teach().teach_lecturers ?? []).length > 0} fallback={<p class={`${card} p-6 text-center text-sm text-muted-foreground-1`}>{t('cd.noRecords')}</p>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cd.fName')}</TableHead>
                  <TableHead>{t('lc.plannedSessions')}</TableHead>
                  <TableHead>{t('lc.realizedSessions')}</TableHead>
                  <TableHead>{t('cd.fCredit')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={teach().teach_lecturers as any[]}>
                  {(l) => (
                    <TableRow>
                      <TableCell class="font-medium" label={t('cd.fName')}>
                        <a href={`/course-department/academic/lecturer/master/lecturer/${encodeURIComponent(l.lecturer_id)}`} class="text-primary hover:underline">{l.name ?? l.code ?? '-'}</a>
                        {l.is_lecturer_home_base ? ' ★' : ''}
                      </TableCell>
                      <TableCell label={t('lc.plannedSessions')}>{l.planning ?? 0}</TableCell>
                      <TableCell label={t('lc.realizedSessions')}>{l.realization ?? 0}</TableCell>
                      <TableCell label={t('cd.fCredit')}>{l.credit ?? '-'}</TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </TabsContent>

        <TabsContent value="students">
          <Show when={(teach().detail_activities ?? []).length > 0} fallback={<p class={`${card} p-6 text-center text-sm text-muted-foreground-1`}>{t('lc.belumAdaMahasiswaTerdaftar')}</p>}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('cd.nim')}</TableHead>
                  <TableHead>{t('cd.mahasiswa')}</TableHead>
                  <TableHead>{t('lc.nilaiAkhir')}</TableHead>
                  <TableHead>{t('lc.grade')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <For each={teach().detail_activities as any[]}>
                  {(d) => (
                    <TableRow>
                      <TableCell class="font-mono" label={t('cd.nim')}>{d.student_nim ?? '-'}</TableCell>
                      <TableCell class="font-medium" label={t('cd.mahasiswa')}>{d.student_name ?? d.name ?? '-'}</TableCell>
                      <TableCell label={t('lc.nilaiAkhir')}>{d.mark ?? '-'}</TableCell>
                      <TableCell label={t('lc.grade')}>{d.grade?.alphabet_code ?? d.grade?.name ?? '-'}</TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </Show>
        </TabsContent>

        <TabsContent value="evaluations">
          <p class="mb-3 text-sm"><a href={`/course-department/academic/campaign/transaction/teach/${encodeURIComponent(teach().id)}/evaluation`} class="text-primary hover:underline">{t('cd.teachEvaluationList')}</a></p>
          <Show when={evals().length > 0} fallback={<p class={`${card} p-6 text-center text-sm text-muted-foreground-1`}>{t('lc.gradeNoComponents')}</p>}>
            <ul class={`${card} divide-y divide-card-divider`}>
              <For each={evals()}>
                {(e) => (
                  <li class="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span class="font-medium">{e.name}</span>
                    <span class="font-mono">{formatNumber(Number(e.evaluation_weight) || 0)}%</span>
                  </li>
                )}
              </For>
            </ul>
            <p class="mt-3 text-sm text-muted-foreground-1">{t('cd.totalWeight')}: {weight()}%</p>
          </Show>
        </TabsContent>
      </Tabs>
    </Errored>
  );
}
