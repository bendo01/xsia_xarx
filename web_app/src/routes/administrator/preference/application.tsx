import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { revalidate } from '@solidjs/router';
import { Errored, For, Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../components/student/PageHeader';
import { t } from '../../../i18n';
import { crudErrorText } from '../../../lib/crud-errors';
import { getApplicationPreference, saveApplicationPreferenceRow } from '../../../lib/preference-data';

export const route = {
  preload: () => {
    void getApplicationPreference();
  },
} satisfies RouteDefinition;

const BACKENDS = [
  { id: 'cpu', label: 'ad.llmBackendCpu' },
  { id: 'cuda', label: 'ad.llmBackendCuda' },
  { id: 'vulkan', label: 'ad.llmBackendVulkan' },
];
const control = 'h-9 w-full rounded-xs border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Switch the LLM chatbot on or off and choose the backend it runs on. */
export default function ApplicationPreferencePage() {
  const data = createMemo(() => getApplicationPreference());
  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('ad.applicationPreference')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={t('ad.applicationPreference')} />
      {/* Mount the form only once the (possibly pending) query has landed: it seeds its state from it. */}
      <Show when={data()}>{(_d) => <PreferenceForm enabled={data().is_llm_enable} backend={data().llm_backend} available={data().available_backends} />}</Show>
    </Errored>
  );
}

function PreferenceForm(props: { enabled: boolean; backend: string; available: string[] }) {
  const [enabled, setEnabled] = createSignal(() => props.enabled);
  const [backend, setBackend] = createSignal(() => props.backend);
  const [busy, setBusy] = createSignal(false);
  const save = async (e: Event) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveApplicationPreferenceRow({ is_llm_enable: enabled(), llm_backend: backend() });
      toast.success(t('ad.applicationPreferenceSaved'));
      await revalidate();
    } catch (err) {
      toast.error(crudErrorText(err, 'cd.saveFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={(e) => void save(e)} class="max-w-lg space-y-4 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
      <label class="flex items-start gap-3">
        <input type="checkbox" class="mt-1 size-4 rounded-xs border-input" checked={enabled()} onChange={(e) => setEnabled(e.currentTarget.checked)} />
        <span>
          <span class="block text-sm font-semibold">{t('ad.llmEnable')}</span>
          <span class="mt-0.5 block text-xs text-muted-foreground-1">{t('ad.llmEnableHint')}</span>
        </span>
      </label>
      <div class="space-y-1">
        <label for="llm-backend" class="block text-sm font-medium">{t('ad.llmBackend')}</label>
        <select id="llm-backend" class={control} value={backend()} onChange={(e) => setBackend(e.currentTarget.value)}>
          <For each={BACKENDS}>
            {(b) => (
              <option value={b.id} disabled={!props.available.includes(b.id)} selected={backend() === b.id}>
                {t(b.label)}
                {props.available.includes(b.id) ? '' : ` (${t('ad.llmBackendUnavailable')})`}
              </option>
            )}
          </For>
        </select>
        <p class="text-xs text-muted-foreground-1">{t('ad.llmBackendHint')}</p>
      </div>
      <button type="submit" disabled={busy()} class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{t('ad.save')}</button>
    </form>
  );
}
