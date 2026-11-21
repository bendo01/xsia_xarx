import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { FA_DEFS, FA_NAV, FA_ROUTE, makeNames, type FaKind } from '../../lib/final-assignment-defs';
import { getFaList } from '../../lib/final-assignment';
import { parsePage } from '../../lib/url';
import Pager from '../Pager';
import PageHeader from '../student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

type Query = Record<string, string | string[] | undefined>;

/** The page number is the only filter, so preload and render share this call shape. */
export const loadFa = (kind: FaKind, q: Query) => getFaList(kind, parsePage(q.page));

/** Small link bar between the final-assignment lists (and the two adviser lists). */
function FaNav(props: { current: FaKind }) {
  const kinds: FaKind[] = props.current === 'counsellor' || props.current === 'adviserDecree' ? ['counsellor', 'adviserDecree'] : FA_NAV;
  return (
    <nav class="mb-4 flex flex-wrap gap-2 text-sm" aria-label={t('cd.faNav')}>
      <For each={kinds}>
        {(k) => (
          <a
            href={FA_ROUTE[k]}
            aria-current={k === props.current ? 'page' : undefined}
            class={['rounded-xs border px-3 py-1', k === props.current ? 'border-primary bg-primary text-primary-foreground' : 'border-layer-line bg-layer hover:bg-layer-hover']}
          >
            {t(FA_DEFS[k].titleKey)}
          </a>
        )}
      </For>
    </nav>
  );
}

/** A read-only list of one adviser / final-assignment collection, ids shown as names. */
export default function FaListPage(props: { kind: FaKind }) {
  const [search] = useSearchParams();
  const q = () => search as Query;
  const def = FA_DEFS[props.kind];
  const data = createMemo(() => loadFa(props.kind, q()));
  const refreshing = () => isPending(() => data());
  const names = createMemo(() => makeNames(data().names));

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t(def.titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-4 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t(def.titleKey)} />
        <FaNav current={props.kind} />
        <Show when={data().data.length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
          <Table>
            <TableHeader>
              <TableRow>
                <For each={def.columns}>{(c) => <TableHead>{t(c.label)}</TableHead>}</For>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={data().data}>
                {(r) => (
                  <TableRow>
                    <For each={def.columns}>{(c, i) => <TableCell class={i() === 0 ? 'font-medium' : ''} label={t(c.label)}>{c.cell(r, names())}</TableCell>}</For>
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
