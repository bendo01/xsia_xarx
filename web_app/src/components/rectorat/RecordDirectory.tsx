import { Title } from '@solidjs/meta';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { getInstitutionRecords, type InstitutionRecordKey } from '../../lib/institution-data';
import { COLUMNS } from '../../lib/crud-views';
import { parsePage } from '../../lib/url';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import UnitPicker from './UnitPicker';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

/** Same call shape in a route's preload and in the page (query() keys on the arguments). */
export const loadRecords = (id: string, key: InstitutionRecordKey, q: Query) =>
  getInstitutionRecords(id, key, one(q.unit), parsePage(q.page), one(q.q));

/** Read-only directory of one unit's records (courses, curricula, ...), reusing the prodi columns. */
export default function RecordDirectory(props: { resource: InstitutionRecordKey; titleKey: string }) {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => loadRecords(params.id as string, props.resource, q()));
  const refreshing = () => isPending(() => data());
  const cols = () => COLUMNS[props.resource];

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(props.titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t(props.titleKey)} />
        <UnitPicker units={data().units} unitId={data().unitId} q={one(q().q)} filtered={!!one(q().q)} />
        <Show when={data().records.data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={cols()}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().records.data}>
                {(r) => (
                  <TableRow>
                    <For each={cols()}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{c.cell(r)}</TableCell>}</For>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().records.pagination.page} totalPages={data().records.pagination.total_page} search={q()} />
      </div>
    </Errored>
  );
}
