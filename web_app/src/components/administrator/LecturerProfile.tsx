import { Title } from '@solidjs/meta';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { formatNumber, t } from '../../i18n';
import { fullName } from '../../lib/individual-profile';
import { getLecturerProfile } from '../../lib/lecturer-profile-data';
import { completionPercent } from '../../lib/lecturer-profile';
import BarChart from '../chart/BarChart';
import LineChart from '../chart/LineChart';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card, Fields, errorBox } from './ProfileParts';

/** One lecturer: identity, appointment, and credit load per academic year. */
export default function LecturerProfile(props: { id: string }) {
  const profile = createMemo(() => getLecturerProfile(props.id));
  const l = () => profile().lecturer;
  const name = () => fullName(l().front_title, l().name, l().last_title) || String(l().code ?? '');
  return (
    <Errored fallback={(err) => <div role="alert" class={errorBox}>{(err() as Error).message}</div>}>
      <Title>{`${name()} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm print:hidden"><a href="/administrator/academic/lecturer/master/lecturer" class="text-primary hover:underline">{t('ad.backToList')}</a></p>
      <PageHeader
        title={name()}
        description={`${t('ad.code2')} ${l().code}`}
        actions={
          <>
            <button type="button" onClick={() => window.print()} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.print')}</button>
            <a href={`/administrator/academic/lecturer/master/lecturer/${encodeURIComponent(props.id)}/edit`} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.edit')}</a>
          </>
        }
      />
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('ad.n1BasicDetails')}>
          <Fields
            rows={[
              [t('ad.code2'), l().code],
              [t('ad.nuptk'), l().nuptk],
              [t('ad.alternativeCode'), l().alternative_code],
              [t('ad.accessorNumber'), l().accessor_number],
              [t('ad.identificationNumber'), l().identification_number],
              [t('ad.person'), l().individual_id ? <a href={`/administrator/person/master/individual/${encodeURIComponent(String(l().individual_id))}/profile`} class="text-primary hover:underline">{t('ad.profile')}</a> : null],
            ] as [string, unknown][]}
          />
        </Card>
        <Card title={t('ad.lecturer')}>
          <Fields
            rows={[
              [t('ad.institution'), profile().names.institution_id],
              [t('ad.status'), profile().names.status_id],
              [t('ad.contract'), profile().names.contract_id],
              [t('ad.rank'), profile().names.rank_id],
              [t('ad.group'), profile().names.group_id],
              [t('ad.startDate'), String(l().start_date ?? '').slice(0, 10)],
              [t('ad.endDate'), String(l().end_date ?? '').slice(0, 10)],
            ]}
          />
        </Card>
      </div>
      <h2 class="mb-2 mt-6 text-base font-semibold">{t('ad.creditPerYear')}</h2>
      <Show when={profile().trends.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
        <div class="space-y-4">
          <Card title={t('ad.totalCredit')}>
            <BarChart items={profile().trends.map((y) => ({ name: y.yearName, value: y.totalCredit }))} ariaLabel={t('ad.creditPerYear')} />
          </Card>
          <Show when={profile().classes.categories.length >= 2}>
            <Card title={t('ad.classesPerYear')}>
              <LineChart categories={profile().classes.categories} series={[{ name: t('ad.classes'), color: '#6366f1', values: profile().classes.values }]} ariaLabel={t('ad.classesPerYear')} format={(n) => formatNumber(n)} />
            </Card>
          </Show>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('ad.academicYear')}</TableHead>
                <TableHead>{t('ad.totalCredit')}</TableHead>
                <TableHead>{t('ad.classes')}</TableHead>
                <TableHead>{t('ad.sessionsHeld')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={profile().trends}>
                {(y) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('ad.academicYear')}>{y.yearName}</TableCell>
                    <TableCell label={t('ad.totalCredit')}>{formatNumber(y.totalCredit, { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell label={t('ad.classes')}>{formatNumber(y.classCount)}</TableCell>
                    <TableCell label={t('ad.sessionsHeld')}>{y.realizedSessions} / {y.plannedSessions}{(() => { const p = completionPercent(y.plannedSessions, y.realizedSessions); return p === null ? '' : ` (${p}%)`; })()}</TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </div>
      </Show>
    </Errored>
  );
}
