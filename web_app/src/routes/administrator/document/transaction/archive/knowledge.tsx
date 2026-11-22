import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { revalidate } from '@solidjs/router';
import { Errored, For, Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../../../components/student/PageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { formatNumber, t } from '../../../../../i18n';
import { getKnowledgeStatus, reindexAllRows, reindexArchiveRow } from '../../../../../lib/archive-data';
import { crudErrorText } from '../../../../../lib/crud-errors';

export const route = {
  preload: () => {
    void getKnowledgeStatus();
  },
} satisfies RouteDefinition;

interface Item { id: string; name: string; size?: number | null; chunk_count: number; last_indexed_at?: string | null }

/** The regulation chatbot's knowledge base: which archives are indexed, and rebuilding the index. */
export default function KnowledgePage() {
  const status = createMemo(() => getKnowledgeStatus());
  const [busy, setBusy] = createSignal(false);
  const run = async (job: () => Promise<{ message: string }>) => {
    setBusy(true);
    try {
      toast.success((await job()).message || t('ad.reindexQueued'));
      await revalidate(getKnowledgeStatus.key);
    } catch (e) {
      toast.error(crudErrorText(e, 'cd.saveFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('ad.knowledgeBase')} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm"><a href="/administrator/document/transaction/archive" class="text-primary hover:underline">{t('ad.backToList')}</a></p>
      <PageHeader
        title={t('ad.knowledgeBase')}
        actions={<button type="button" disabled={busy()} onClick={() => void run(reindexAllRows)} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{t('ad.reindexAll')}</button>}
      />
      <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs"><p class="text-xs font-medium uppercase text-muted-foreground-1">{t('ad.totalChunks')}</p><p class="mt-1 text-2xl font-semibold">{formatNumber(Number(status().total_chunks ?? 0))}</p></div>
        <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs"><p class="text-xs font-medium uppercase text-muted-foreground-1">{t('ad.queueLength')}</p><p class="mt-1 text-2xl font-semibold">{formatNumber(Number(status().queue_length ?? 0))}</p></div>
        <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs"><p class="text-xs font-medium uppercase text-muted-foreground-1">{t('ad.doclingAvailable')}</p><p class="mt-1 text-2xl font-semibold">{status().docling_available ? '✓' : '–'}</p></div>
      </div>
      <Show when={(status().items as Item[] | undefined)?.length} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
        <Table>
          <TableHeader><TableRow><TableHead>{t('ad.name')}</TableHead><TableHead>{t('ad.totalChunks')}</TableHead><TableHead>{t('ad.lastIndexed')}</TableHead><TableHead class="text-end">{t('ad.actions')}</TableHead></TableRow></TableHeader>
          <TableBody>
            <For each={status().items as Item[]}>
              {(i) => (
                <TableRow>
                  <TableCell class="font-medium" label={t('ad.name')}>{i.name}</TableCell>
                  <TableCell label={t('ad.totalChunks')}>{i.chunk_count}</TableCell>
                  <TableCell label={t('ad.lastIndexed')}>{String(i.last_indexed_at ?? '–').slice(0, 19).replace('T', ' ')}</TableCell>
                  <TableCell class="text-end" label={t('ad.actions')}><button type="button" disabled={busy()} onClick={() => void run(() => reindexArchiveRow(i.id))} class="text-sm font-medium text-primary hover:underline disabled:opacity-50">{t('ad.reindex')}</button></TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
    </Errored>
  );
}
