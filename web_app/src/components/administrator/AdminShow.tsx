import { Title } from '@solidjs/meta';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { adminUrl, type AdminResource } from '../../lib/admin-resources';
import { getAdminRecord } from '../../lib/admin-crud-data';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

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
  const data = createMemo(() => getAdminRecord(r().key, props.id));
  const record = () => data().record;
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
            <button type="button" onClick={() => window.print()} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.print')}</button>
            <a href={adminUrl(r())} class="text-sm text-primary hover:underline">{t('cd.cancel')}</a>
            <Show when={r().hasProfile}><a href={adminUrl(r(), props.id, 'profile')} class="text-sm text-primary hover:underline">{t('ad.profile')}</a></Show>
            <Show when={r().permissionOwner}><a href={adminUrl(r(), props.id, 'permissions')} class="text-sm text-primary hover:underline">{t('ad.permissions')}</a></Show>
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
                <TableCell label={k}>
                  <Show when={data().links[k]} fallback={display(v)}>
                    {(l) => <Show when={l().href} fallback={l().label}><a href={l().href} class="text-primary hover:underline">{l().label}</a></Show>}
                  </Show>
                </TableCell>
              </TableRow>
            )}
          </For>
        </TableBody>
      </Table>
      <For each={data().related}>
        {(rel) => (
          <section class="mt-6 print:break-inside-avoid">
            <h2 class="mb-2 text-base font-semibold">
              <a href={rel.listHref} class="hover:text-primary">{t(rel.titleKey)}</a>
              <span class="ms-2 text-sm font-normal text-muted-foreground-1">{rel.total}</span>
            </h2>
            <Table>
              <TableHeader>
                <TableRow><For each={rel.columns}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For></TableRow>
              </TableHeader>
              <TableBody>
                <For each={rel.rows}>
                  {(row) => (
                    <TableRow>
                      <For each={rel.columns}>
                        {(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{i() === 0 ? <a href={row.href} class="text-primary hover:underline">{display(row.cells[i()]) || row.id.slice(0, 8)}</a> : display(row.cells[i()])}</TableCell>}
                      </For>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </section>
        )}
      </For>
    </Errored>
  );
}
