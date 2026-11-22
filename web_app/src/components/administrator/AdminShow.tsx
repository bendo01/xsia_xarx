import { Title } from '@solidjs/meta';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { adminUrl, type AdminResource } from '../../lib/admin-resources';
import { getAdminRecord } from '../../lib/admin-crud-data';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableRow } from '../ui/table';

/** Attributes the detail page leaves out: bookkeeping, not data. */
const HIDDEN = new Set(['deleted_at', 'created_by', 'updated_by', 'lft', 'rght']);

const display = (v: unknown): string => {
  if (v === null || v === undefined || v === '') return '';
  if (v === true) return '✓';
  if (v === false) return '–';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 200);
  return String(v);
};

/** Every attribute of one record (the old client's "all entity attributes" view), for any registered resource. */
export default function AdminShow(props: { resource: AdminResource; id: string }) {
  const r = () => props.resource;
  const record = createMemo(() => getAdminRecord(r().key, props.id));
  const labels = () => new Map([...r().fields.map((f) => [f.name, f.label] as const), ...r().columns.map((c) => [c.field, c.label] as const)]);
  const rows = () => Object.entries(record()).filter(([k, v]) => !HIDDEN.has(k) && k !== 'id' && (typeof v !== 'object' || v === null));
  const title = () => `${t(r().titleKey)} · ${display(record().name ?? record().code ?? record().title) || String(record().id).slice(0, 8)}`;
  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(r().titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={title()}
        description={String(record().id)}
        actions={
          <>
            <a href={adminUrl(r())} class="text-sm text-primary hover:underline">{t('cd.cancel')}</a>
            <Show when={!r().readOnly}>
              <a href={adminUrl(r(), props.id, 'edit')} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.edit')}</a>
            </Show>
          </>
        }
      />
      <Table>
        <TableBody>
          <For each={rows()}>
            {([k, v]) => (
              <TableRow>
                <TableCell class="w-1/3 font-medium" label={t('ad.name')}>{labels().has(k) ? t(labels().get(k)!) : k}</TableCell>
                <TableCell label={k}>{display(v)}</TableCell>
              </TableRow>
            )}
          </For>
        </TableBody>
      </Table>
    </Errored>
  );
}
