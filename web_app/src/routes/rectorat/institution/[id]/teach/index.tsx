import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../components/Pager';
import UnitPicker from '../../../../../components/rectorat/UnitPicker';
import LockStatus from '../../../../../components/student/LockStatus';
import PageHeader from '../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { t } from '../../../../../i18n';
import { getInstitutionActivityOptions, getInstitutionTeaches, getInstitutionUnitOptions } from '../../../../../lib/institution-data';
import { parsePage, parsePageSize } from '../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (id: string, q: Query) => getInstitutionTeaches(id, one(q.unit), parsePage(q.page), one(q.q), one(q.activity), one(q.lock), parsePageSize(q.size));

export const route = {
  preload: ({ params, location }) => {
    void load(params.id as string, location.query as Query);
    void getInstitutionUnitOptions(params.id as string);
    void getInstitutionActivityOptions(params.id as string, one((location.query as Query).unit));
  },
} satisfies RouteDefinition;

const field = 'h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm';

/** Teaching classes of one unit of the institution (read-only). */
export default function InstitutionTeaches() {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(params.id as string, q()));
  // Option lists do not depend on the page or filters: their own queries, requested once.
  const units = createMemo(() => getInstitutionUnitOptions(params.id as string));
  const activities = createMemo(() => getInstitutionActivityOptions(params.id as string, one(q().unit)));
  const refreshing = () => isPending(() => data());

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('menu.rectorat.teachActivityList')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.rectorat.teachActivityList')} />
        <UnitPicker units={units()} unitId={data().unitId} q={one(q().q)} filtered={!!(one(q().q) || one(q().activity) || one(q().lock))}>
          <select name="activity" class={field}>
            <option value="">{t('cd.allActivities')}</option>
            <For each={activities()}>{(a) => <option value={a.id} selected={one(q().activity) === a.id}>{a.name}</option>}</For>
          </select>
          <select name="lock" class={field}>
            <option value="">{t('cd.status')}</option>
            <option value="locked" selected={one(q().lock) === 'locked'}>{t('lc.locked')}</option>
            <option value="unlocked" selected={one(q().lock) === 'unlocked'}>{t('lc.unsaved')}</option>
          </select>
        </UnitPicker>
        <Show when={data().teaches.data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.teachCourse')}</TableHead>
                <TableHead>{t('cd.teachClassCode')}</TableHead>
                <TableHead>{t('cd.teachMembers')}</TableHead>
                <TableHead>{t('st.lockStatus')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().teaches.data}>
                {(r) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('cd.teachCourse')}>
                      <span class="block font-mono text-xs text-muted-foreground-1">{r.course?.code ?? ''}</span>
                      {r.course?.name ?? r.name ?? '-'}
                    </TableCell>
                    <TableCell label={t('cd.teachClassCode')}>{r.class_code?.name ?? '-'}</TableCell>
                    <TableCell label={t('cd.teachMembers')}>{r.enrolled_count ?? 0}{r.max_member ? ` / ${r.max_member}` : ''}</TableCell>
                    <TableCell label={t('st.lockStatus')}><LockStatus locked={!!r.is_lock} /></TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().teaches.pagination.page} totalPages={data().teaches.pagination.total_page} search={q()} pageSize={parsePageSize(q().size)} total={data().teaches.pagination.total_data} />
      </div>
    </Errored>
  );
}
