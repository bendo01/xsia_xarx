import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../components/Pager';
import StatusBadge from '../../../../../components/student/StatusBadge';
import UnitPicker from '../../../../../components/rectorat/UnitPicker';
import PageHeader from '../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { t } from '../../../../../i18n';
import { getInstitutionLecturers } from '../../../../../lib/institution-data';
import { fullName } from '../../../../../lib/student-select';
import { parsePage, parsePageSize } from '../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const load = (id: string, q: Query) => getInstitutionLecturers(id, one(q.unit), parsePage(q.page), one(q.q), parsePageSize(q.size));

export const route = {
  preload: ({ params, location }) => {
    void load(params.id as string, location.query as Query);
  },
} satisfies RouteDefinition;

const nameOf = (v: any) => (v && typeof v === 'object' ? v.name : undefined);

/** Lecturers homebased in one unit of the institution (read-only). */
export default function InstitutionLecturers() {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => load(params.id as string, q()));
  const refreshing = () => isPending(() => data());

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('menu.rectorat.lecturerList')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('menu.rectorat.lecturerList')} />
        <UnitPicker units={data().units} unitId={data().unitId} q={one(q().q)} filtered={!!one(q().q)} />
        <Show when={data().lecturers.data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('cd.fName')}</TableHead>
                <TableHead>{t('cd.lecturerGroup')}</TableHead>
                <TableHead>{t('cd.contractType2')}</TableHead>
                <TableHead>{t('cd.status')}</TableHead>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().lecturers.data}>
                {(l) => (
                  <TableRow>
                    <TableCell class="font-medium" label={t('cd.fName')}>
                      <span class="block">{fullName({ name: l.name ?? '-', front_title: l.front_title, last_title: l.last_title })}</span>
                      <span class="font-mono text-xs text-muted-foreground-1">{l.nidn || l.code || ''}</span>
                    </TableCell>
                    <TableCell label={t('cd.lecturerGroup')}>{l.group_name ?? nameOf(l.group) ?? '-'}</TableCell>
                    <TableCell label={t('cd.contractType2')}>{l.contract_name ?? nameOf(l.contract) ?? '-'}</TableCell>
                    <TableCell label={t('cd.status')}><StatusBadge name={l.status_name ?? nameOf(l.status)} /></TableCell>
                    <TableCell class="text-end">
                      <a href={`/rectorat/institution/${encodeURIComponent(params.id as string)}/lecturer/${encodeURIComponent(l.id)}`} class="text-sm font-medium text-primary hover:underline">{t('cd.detail')}</a>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().lecturers.pagination.page} totalPages={data().lecturers.pagination.total_page} search={q()} pageSize={parsePageSize(q().size)} total={data().lecturers.pagination.total_data} />
      </div>
    </Errored>
  );
}
