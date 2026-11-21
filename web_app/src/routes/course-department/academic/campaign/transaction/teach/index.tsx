import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../../components/Pager';
import LockStatus from '../../../../../../components/student/LockStatus';
import PageHeader from '../../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../components/ui/table';
import { t } from '../../../../../../i18n';
import { getUnitTeaches } from '../../../../../../lib/unit';
import { parsePage } from '../../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (q: Query) => getUnitTeaches(parsePage(q.page), one(q.q), one(q.activity), one(q.lock));

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

const field = 'h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm';

/** The unit's teaching classes (read-only): search, semester activity and lock filters. */
export default function UnitTeaches() {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(q()));
  const refreshing = () => isPending(() => data());

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('menu.courseDepartment.teachDirectory')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.courseDepartment.teachDirectory')} actions={<a href="/course-department/academic/campaign/transaction/teach/create" class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.addNew')}</a>} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class={`${field} min-w-0 flex-1 sm:max-w-sm`} />
          <select name="activity" class={field}>
            <option value="">{t('cd.allActivities')}</option>
            <For each={data().activities}>{(a) => <option value={a.id} selected={one(q().activity) === a.id}>{a.name}</option>}</For>
          </select>
          <select name="lock" class={field}>
            <option value="">{t('cd.status')}</option>
            <option value="locked" selected={one(q().lock) === 'locked'}>{t('lc.locked')}</option>
            <option value="unlocked" selected={one(q().lock) === 'unlocked'}>{t('lc.unsaved')}</option>
          </select>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q) || one(q().activity) || one(q().lock)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.teachCourse')}</TableHead>
                <TableHead>{t('cd.teachClassCode')}</TableHead>
                <TableHead>{t('cd.teachMembers')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(r) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('cd.teachCourse')}>
                      <span class="block font-mono text-xs text-muted-foreground-1">{r.course?.code ?? ''}</span>
                      {r.course?.name ?? r.name ?? '-'}
                    </TableCell>
                    <TableCell label={t('cd.teachClassCode')}>{r.class_code?.name ?? '-'}</TableCell>
                    <TableCell label={t('cd.teachMembers')}>{r.enrolled_count ?? 0}{r.max_member ? ` / ${r.max_member}` : ''}</TableCell>
                    <TableCell label={t('cd.status')}><LockStatus locked={!!r.is_lock} /></TableCell>
                    <TableCell class="text-end">
                      <span class="inline-flex gap-x-4 text-sm font-medium">
                        <a href={`/course-department/academic/campaign/transaction/teach/${encodeURIComponent(r.id)}`} class="text-primary hover:underline">{t('cd.detail')}</a>
                        <Show when={!r.is_lock}>
                          <a href={`/course-department/academic/campaign/transaction/teach/${encodeURIComponent(r.id)}/edit`} class="text-primary hover:underline">{t('cd.edit')}</a>
                        </Show>
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={q()} />
      </div>
    </Errored>
  );
}
