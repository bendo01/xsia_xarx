import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Errored, For, Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../../../components/student/PageHeader';
import { t } from '../../../../../i18n';
import { getArchiveTypes } from '../../../../../lib/archive-data';
import { uploadProblem } from '../../../../../lib/archive-upload';

export const route = {
  preload: () => {
    void getArchiveTypes();
  },
} satisfies RouteDefinition;

const control = 'h-9 w-full rounded-xs border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const PROBLEM: Record<string, string> = { noFile: 'ad.uploadNoFile', tooLarge: 'ad.uploadTooLarge', noType: 'ad.uploadNoType', badOwner: 'ad.uploadBadOwner', tooLong: 'ad.uploadTooLong', pdfOnly: 'ad.uploadPdfOnly' };

/** Upload a file as an archive; a PDF can also join the regulation chatbot's knowledge base. */
export default function ArchiveUploadPage() {
  const types = createMemo(() => getArchiveTypes());
  const [file, setFile] = createSignal<File | null>(null);
  const [typeId, setTypeId] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [knowledge, setKnowledge] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const [result, setResult] = createSignal<{ name: string; status?: string; warning?: string } | null>(null);

  const submit = async (e: Event) => {
    e.preventDefault();
    const f = file();
    const problem = uploadProblem({ fileName: f?.name ?? '', fileType: f?.type ?? '', fileSize: f?.size ?? 0, archiveTypeId: typeId(), description: description(), isKnowledge: knowledge() });
    if (problem) return void toast.error(t(PROBLEM[problem]));
    const body = new FormData();
    body.set('file', f!, f!.name);
    body.set('archive_type_id', typeId());
    if (description().trim()) body.set('description', description().trim());
    if (knowledge()) body.set('is_knowledge', 'true');
    setBusy(true);
    try {
      const res = await fetch('/api/administrator/archive-upload', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || String(res.status));
      setResult({ name: String(data?.archive?.name ?? f!.name), status: data?.knowledge_status ?? undefined, warning: data?.warning ?? undefined });
      toast.success(t('ad.uploadDone'));
      setFile(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('ad.upload')} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm"><a href="/administrator/document/transaction/archive" class="text-primary hover:underline">{t('ad.backToList')}</a></p>
      <PageHeader title={t('ad.upload')} />
      <form onSubmit={(e) => void submit(e)} class="max-w-xl space-y-4 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
        <div class="space-y-1">
          <label for="archive-file" class="block text-sm font-medium">{t('ad.file')} <span class="text-destructive">*</span></label>
          <input id="archive-file" type="file" onChange={(e) => setFile(e.currentTarget.files?.[0] ?? null)} class="block w-full text-sm" />
        </div>
        <div class="space-y-1">
          <label for="archive-type" class="block text-sm font-medium">{t('ad.archiveType')} <span class="text-destructive">*</span></label>
          <select id="archive-type" class={control} value={typeId()} onChange={(e) => setTypeId(e.currentTarget.value)}>
            <option value="">{t('cd.selectOne')}</option>
            <For each={types()}>{(o) => <option value={o.id} selected={typeId() === o.id}>{o.name}</option>}</For>
          </select>
        </div>
        <div class="space-y-1">
          <label for="archive-description" class="block text-sm font-medium">{t('ad.description')}</label>
          <input id="archive-description" type="text" maxlength={1000} value={description()} onInput={(e) => setDescription(e.currentTarget.value)} class={control} />
        </div>
        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" class="mt-1" checked={knowledge()} onChange={(e) => setKnowledge(e.currentTarget.checked)} />
          <span>{t('ad.isKnowledge')}<span class="block text-xs text-muted-foreground-1">{t('ad.uploadKnowledgeHint')}</span></span>
        </label>
        <button type="submit" disabled={busy()} class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{t('ad.upload')}</button>
      </form>
      <Show when={result()}>
        {(r) => (
          <div class="mt-4 max-w-xl rounded-xs border border-card-line bg-card p-4 text-sm shadow-2xs" role="status">
            <p class="font-medium">{r().name}</p>
            <Show when={r().status}><p class="text-muted-foreground-1">{t('ad.knowledgeStatus')}: {r().status}</p></Show>
            <Show when={r().warning}><p class="text-warning">{r().warning}</p></Show>
          </div>
        )}
      </Show>
    </Errored>
  );
}
