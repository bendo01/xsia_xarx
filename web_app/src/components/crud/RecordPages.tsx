import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { getChild, getChildren, getRecord, getRecords } from '../../lib/crud';
import { BASE, childBase, parentOfChild } from '../../lib/crud-forms';
import type { ChildKey, TopKey as ResourceKey } from '../../lib/crud-schema';
import { CHILD_COLUMNS, CHILD_TITLES, COLUMNS, DETAIL, TITLES } from '../../lib/crud-views';
import { parsePage } from '../../lib/url';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import DeleteButton from './DeleteButton';
import RecordForm from './RecordForm';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const btn = 'rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm font-medium hover:bg-layer-hover';
const primary = 'rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90';

function ErrorBox(props: { error: unknown }) {
  return (
    <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <p>{(props.error as Error)?.message}</p>
    </div>
  );
}

/** The same call shape for preload and render (query() keys on the arguments). */
export const loadList = (key: ResourceKey, q: Query) => getRecords(key, parsePage(q.page), one(q.q));

export function RecordListPage(props: { resource: ResourceKey }) {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => loadList(props.resource, q()));
  const refreshing = () => isPending(() => data());
  const cols = COLUMNS[props.resource];

  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${t(TITLES[props.resource].list)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t(TITLES[props.resource].list)} actions={<a href={`${BASE[props.resource]}/create`} class={primary}>{t('cd.addNew')}</a>} />
        <form method="get" class="flex flex-wrap items-center gap-2">
          <input type="search" name="q" value={one(q().q)} placeholder={t('common.search')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
          <Show when={one(q().q)}><a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a></Show>
        </form>
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={cols}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For>
                <TableHead class="text-end">{t('cd.aksi')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(r) => (
                  <TableRow>
                    <For each={cols}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{c.cell(r)}</TableCell>}</For>
                    <TableCell class="text-end">
                      <span class="inline-flex gap-x-4 text-sm font-medium">
                        <a href={`${BASE[props.resource]}/${encodeURIComponent(r.id)}`} class="text-primary hover:underline">{t('cd.detail')}</a>
                        <a href={`${BASE[props.resource]}/${encodeURIComponent(r.id)}/edit`} class="text-primary hover:underline">{t('cd.edit')}</a>
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

/** Create (no `id`) or edit form page. */
export function RecordFormPage(props: { resource: ResourceKey; id?: string }) {
  const [search] = useSearchParams();
  const emp = () => (props.resource === 'staff' ? one((search as Query).emp) : '');
  const curriculum = () => (props.resource === 'teach' ? one((search as Query).curriculum) : '');
  const data = createMemo(() => getRecord(props.resource, props.id ?? '', emp() || curriculum()));
  const title = () => t(props.id ? TITLES[props.resource].edit : TITLES[props.resource].add);
  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={title()} />
      <Show when={props.resource === 'staff' && !props.id}>
        <form method="get" class="mb-4 flex flex-wrap items-center gap-2">
          <input type="search" name="emp" value={emp()} placeholder={t('cd.fEmployeeSearch')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
          <button type="submit" class={btn}>{t('cd.applyFilters')}</button>
          <span class="text-xs text-muted-foreground-1">{t('cd.employeeSearchHint')}</span>
        </form>
      </Show>
      <Show when={props.resource === 'teach'}>
        <form method="get" class="mb-4 flex flex-wrap items-center gap-2">
          <label for="pick-curriculum" class="text-sm font-medium">{t('cd.fCurriculumPick')}</label>
          <select id="pick-curriculum" name="curriculum" class="h-9 min-w-0 rounded-xs border border-layer-line bg-layer px-3 text-sm">
            <option value="">{t('cd.selectOne')}</option>
            <For each={data().options._curricula ?? []}>{(c) => <option value={c.id} selected={curriculum() === c.id}>{c.name}</option>}</For>
          </select>
          <button type="submit" class={btn}>{t('cd.applyFilters')}</button>
          <span class="text-xs text-muted-foreground-1">{t('cd.curriculumPickHint')}</span>
        </form>
      </Show>
      <RecordForm resource={props.resource} id={props.id} record={data().record} options={data().options} />
    </Errored>
  );
}

/** Read-only detail with edit and delete. */
export function RecordShowPage(props: { resource: ResourceKey; id: string }) {
  const data = createMemo(() => getRecord(props.resource, props.id));
  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${data().record?.name ?? ''} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={String(data().record?.name ?? '')}
        actions={
          <>
            <a href={BASE[props.resource]} class={btn}>{t('cd.back')}</a>
            <a href={`${BASE[props.resource]}/${encodeURIComponent(props.id)}/edit`} class={primary}>{t('cd.edit')}</a>
            <DeleteButton resource={props.resource} id={props.id} />
          </>
        }
      />
      <Show when={props.resource === 'course'}>
        <p class="mb-4 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <a href={childBase('learnPlanning', props.id)} class="text-primary hover:underline">{t('cd.learnPlannings')}</a>
          <a href={childBase('evaluationPlanning', props.id)} class="text-primary hover:underline">{t('cd.evalPlannings')}</a>
        </p>
      </Show>
      <Show when={props.resource === 'activity'}>
        <p class="mb-4 text-sm"><a href={childBase('teachDecree', props.id)} class="text-primary hover:underline">{t('cd.teachDecrees')}</a></p>
      </Show>
      <Show when={props.resource === 'curriculum'}>
        <p class="mb-4 text-sm"><a href={childBase('curriculumDetail', props.id)} class="text-primary hover:underline">{t('cd.curriculumCourses')}</a></p>
      </Show>
      <section class="rounded-xs border border-card-line bg-card px-5 py-2 shadow-2xs">
        <dl class="divide-y divide-card-divider">
          <For each={DETAIL[props.resource]}>
            {(c) => (
              <div class="py-2.5 sm:grid sm:grid-cols-3 sm:gap-4">
                <dt class="text-sm text-muted-foreground-1">{t(c.label)}</dt>
                <dd class="mt-1 text-sm text-foreground sm:col-span-2 sm:mt-0">{c.cell(data().record ?? {})}</dd>
              </div>
            )}
          </For>
        </dl>
      </section>
    </Errored>
  );
}

/** Children of a course / curriculum (plan items, courses in a curriculum) with add / edit / delete. */
export function ChildListPage(props: { resource: ChildKey; parentId: string }) {
  const [search] = useSearchParams();
  const data = createMemo(() => getChildren(props.resource, props.parentId, parsePage((search as Query).page)));
  const cols = CHILD_COLUMNS[props.resource];
  const ctx = createMemo(() => ({ ...data().names, _text: { unknownWeekday: `⚠ ${t('cd.weekdayUnknown')}` } }));
  const parentName = () => String(data().parent.name ?? data().parent.course?.name ?? '');
  const title = () => `${t(CHILD_TITLES[props.resource].list)} — ${parentName()}`;
  const total = () =>
    props.resource === 'evaluationPlanning' ? data().rows.data.reduce((s: number, r: any) => s + (Number(r.percentage) || 0), 0) : null;
  const parentHref = () => `${BASE[parentOfChild(props.resource)]}/${encodeURIComponent(props.parentId)}`;

  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${t(CHILD_TITLES[props.resource].list)} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={title()}
        actions={
          <>
            <a href={parentHref()} class={btn}>{t('cd.back')}</a>
            <a href={`${childBase(props.resource, props.parentId)}/create`} class={primary}>{t('cd.addNew')}</a>
          </>
        }
      />
      <Show when={data().rows.data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
        <Table>
          <TableHeader>
            <TableRow>
              <For each={cols}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For>
              <TableHead class="text-end">{t('cd.aksi')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={data().rows.data}>
              {(r) => (
                <TableRow>
                  <For each={cols}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{c.cell(r, ctx())}</TableCell>}</For>
                  <TableCell class="text-end">
                    <span class="inline-flex items-center gap-x-4 text-sm font-medium">
                      <a href={`${childBase(props.resource, props.parentId)}/${encodeURIComponent(r.id)}/edit`} class="text-primary hover:underline">{t('cd.edit')}</a>
                      <DeleteButton resource={props.resource} parentId={props.parentId} id={r.id} class="text-destructive hover:underline" />
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
      <Show when={total() !== null}>
        <p class="mt-3 text-sm text-muted-foreground-1">{t('cd.totalWeight')}: {total()}%</p>
      </Show>
      <Pager page={data().rows.pagination.page} totalPages={data().rows.pagination.total_page} search={search as Query} />
    </Errored>
  );
}

export function ChildFormPage(props: { resource: ChildKey; parentId: string; id?: string }) {
  const data = createMemo(() => getChild(props.resource, props.parentId, props.id ?? ''));
  const title = () => t(props.id ? CHILD_TITLES[props.resource].edit : CHILD_TITLES[props.resource].add);
  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={`${title()} — ${String(data().parent.name ?? data().parent.course?.name ?? '')}`} />
      <RecordForm resource={props.resource} parentId={props.parentId} id={props.id} record={data().record} options={data().options} />
    </Errored>
  );
}
