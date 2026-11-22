import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { FEEDER_GROUPS, FEEDER_WRITABLE, feederUrl, type FeederGroup } from '../../lib/feeder-admin';
import { deleteFeederRow, getFeederForm, getFeederList, getFeederRecord, saveFeederRow } from '../../lib/feeder-admin-data';
import { feederCell, feederColumns, feederLabel, feederTitle } from '../../lib/feeder';
import { parsePage, parsePageSize } from '../../lib/url';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import DeleteRow from '../rectorat/DeleteRow';
import WriteForm from '../rectorat/WriteForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Query = Record<string, string | string[] | undefined>;
const box = 'rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive';

/** Same call shape in a route's preload and in the page (query() keys on the arguments). */
export const loadFeederList = (group: FeederGroup, slug: string, q: Query) => getFeederList(group, slug, parsePage(q.page), parsePageSize(q.size));

const GROUP_TITLE: Record<FeederGroup, string> = { master: 'rt.feederMaster', referensi: 'rt.feederReferensi', akumulasi: 'ad.akumulasi', akun: 'ad.akun', rekapitulasi: 'ad.rekapitulasi' };

/** Every Feeder table, grouped, each opening its list. */
export function FeederIndex() {
  return (
    <>
      <Title>{`${t('ad.feederPDDikti')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={t('ad.feederPDDikti')} />
      <For each={Object.keys(FEEDER_GROUPS) as FeederGroup[]}>
        {(group) => (
          <section class="mb-6">
            <h2 class="mb-2 text-base font-semibold">{t(GROUP_TITLE[group])}</h2>
            <ul class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <For each={FEEDER_GROUPS[group]}>
                {(slug) => (
                  <li class="min-w-0"><a href={feederUrl(group, slug)} class="block truncate rounded-xs border border-card-line bg-card px-3 py-2 text-sm text-primary shadow-2xs hover:bg-muted-hover">{feederTitle(slug)}</a></li>
                )}
              </For>
            </ul>
          </section>
        )}
      </For>
    </>
  );
}

/** One Feeder table: columns come from the first row's readable fields. */
export function FeederList(props: { group: FeederGroup; slug: string }) {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => loadFeederList(props.group, props.slug, q()));
  const refreshing = () => isPending(() => data());
  const cols = () => feederColumns(data().data);
  const writable = () => FEEDER_WRITABLE.includes(props.group);
  return (
    <Errored fallback={(err) => <div role="alert" class={box}>{(err() as Error).message}</div>}>
      <Title>{`${feederTitle(props.slug)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <p class="text-sm"><a href="/administrator/feeder" class="text-primary hover:underline">{t('ad.feederPDDikti')}</a></p>
        <PageHeader
          title={feederTitle(props.slug)}
          actions={<>
            <a href={`/api/administrator/feeder-export?group=${encodeURIComponent(props.group)}&slug=${encodeURIComponent(props.slug)}`} download class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.exportCSV')}</a>
            <Show when={writable()}><a href={feederUrl(props.group, props.slug, 'create')} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.addNew')}</a></Show></>}
        />
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={cols()}>{(c) => <TableHead>{feederLabel(c)}</TableHead>}</For>
                <TableHead class="text-end">{t('ad.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(r) => (
                  <TableRow>
                    <For each={cols()}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={feederLabel(c)}>{feederCell(r[c])}</TableCell>}</For>
                    <TableCell class="text-end" label={t('ad.actions')}>
                      <span class="inline-flex gap-x-4">
                        <a href={feederUrl(props.group, props.slug, String(r.id))} class="text-sm font-medium text-primary hover:underline">{t('ad.detail2')}</a>
                        <Show when={writable()}>
                          <a href={feederUrl(props.group, props.slug, String(r.id), 'edit')} class="text-sm font-medium text-primary hover:underline">{t('cd.edit')}</a>
                          <DeleteRow remove={() => deleteFeederRow(props.slug, String(r.id))} />
                        </Show>
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </For>
            </TableBody>
          </Table>
        </Show>
        <Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={q()} pageSize={parsePageSize(q().size)} total={data().pagination.total_data} />
      </div>
    </Errored>
  );
}

const show = (v: unknown) => (typeof v === 'object' && v !== null ? JSON.stringify(v).slice(0, 200) : feederCell(v));

/** Every attribute of one Feeder record. */
export function FeederShow(props: { group: FeederGroup; slug: string; id: string }) {
  const record = createMemo(() => getFeederRecord(props.group, props.slug, props.id));
  const rows = () => Object.entries(record()).filter(([k]) => !['deleted_at', 'created_by', 'updated_by'].includes(k));
  return (
    <Errored fallback={(err) => <div role="alert" class={box}>{(err() as Error).message}</div>}>
      <Title>{`${feederTitle(props.slug)} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm"><a href={feederUrl(props.group, props.slug)} class="text-primary hover:underline">{feederTitle(props.slug)}</a></p>
      <PageHeader
        title={feederTitle(props.slug)}
        description={props.id}
        actions={<Show when={FEEDER_WRITABLE.includes(props.group)}><a href={feederUrl(props.group, props.slug, props.id, 'edit')} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.edit')}</a></Show>}
      />
      <Table>
        <TableBody>
          <For each={rows()}>{([k, v]) => <TableRow><TableCell class="w-1/3 font-medium" label={t('ad.name')}>{feederLabel(k)}</TableCell><TableCell label={k}>{show(v)}</TableCell></TableRow>}</For>
        </TableBody>
      </Table>
    </Errored>
  );
}

/** Create or edit a reference-table record; the fields are those of the table's own rows. */
export function FeederForm(props: { slug: string; id?: string }) {
  const data = createMemo(() => getFeederForm(props.slug, props.id ?? ''));
  const back = () => feederUrl('referensi', props.slug);
  const title = () => `${t(props.id ? 'cd.edit' : 'cd.addNew')} · ${feederTitle(props.slug)}`;
  return (
    <Errored fallback={(err) => <div role="alert" class={box}>{(err() as Error).message}</div>}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={title()} />
      {/* Mount the form only once the (possibly pending) query has landed: it seeds its state from it. */}
      <Show when={data()} keyed={false}>
        {(_d) => (
          <Show when={data().fields.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
            <WriteForm
              fields={data().fields.map((f) => ({ name: f.name, label: feederLabel(f.name), kind: f.type === 'boolean' ? ('check' as const) : ('text' as const) }))}
              initial={Object.fromEntries(data().fields.map((f) => [f.name, f.type === 'boolean' ? data().record?.[f.name] === true : String(data().record?.[f.name] ?? '')]))}
              save={(v) => saveFeederRow(props.slug, props.id ?? '', v)}
              backHref={back()}
            />
          </Show>
        )}
      </Show>
    </Errored>
  );
}
