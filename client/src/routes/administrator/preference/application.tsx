import { createSignal, For, onMount, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { type LlmBackend, PreferenceApplicationShow, PreferenceApplicationUpdate } from '~/controllers/preference/PreferenceApplicationController';
import { t } from '../../../i18n';

const BACKENDS: { id: LlmBackend; label: string }[] = [
    { id: 'cpu', label: 'ad.llmBackendCpu' },
    { id: 'cuda', label: 'ad.llmBackendCuda' },
    { id: 'vulkan', label: 'ad.llmBackendVulkan' },
];

export default function PreferenceApplicationPage() {
    const [isLlmEnable, setIsLlmEnable] = createSignal(false);
    const [llmBackend, setLlmBackend] = createSignal<LlmBackend>('cpu');
    const [availableBackends, setAvailableBackends] = createSignal<LlmBackend[]>(['cpu']);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSaving, setIsSaving] = createSignal(false);

    onMount(async () => {
        const res = await PreferenceApplicationShow();
        if (res.is_error) toast.danger(res.message);
        else {
            setIsLlmEnable(res.data.is_llm_enable);
            setLlmBackend(res.data.llm_backend);
            setAvailableBackends(res.data.available_backends);
        }
        setIsLoading(false);
    });

    const save = async (e: SubmitEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await PreferenceApplicationUpdate({ is_llm_enable: isLlmEnable(), llm_backend: llmBackend() });
        setIsSaving(false);
        if (res.is_error) toast.danger(res.message);
        else toast.success(t('ad.applicationPreferenceSaved'));
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-foreground">
            <TopBar />
            <main class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                <div class="border-b border-border pb-4">
                    <h1 class="text-2xl font-bold tracking-tight font-mono">{t('ad.applicationPreference')}</h1>
                </div>

                <Show when={!isLoading()} fallback={<p class="text-sm text-neutral-500">{t('au.memproses')}</p>}>
                    <form onSubmit={save} class="max-w-lg space-y-4 p-6 bg-card/60 border border-border rounded-lg">
                        <label class="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                class="mt-1"
                                checked={isLlmEnable()}
                                onChange={(e) => setIsLlmEnable(e.currentTarget.checked)}
                            />
                            <span>
                                <span class="block text-sm font-semibold">{t('ad.llmEnable')}</span>
                                <span class="block text-xs text-muted-foreground mt-0.5">{t('ad.llmEnableHint')}</span>
                            </span>
                        </label>
                        <div>
                            <label class="block text-sm font-semibold mb-1" for="llm-backend">
                                {t('ad.llmBackend')}
                            </label>
                            <select
                                id="llm-backend"
                                class="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                                value={llmBackend()}
                                onChange={(e) => setLlmBackend(e.currentTarget.value as LlmBackend)}
                            >
                                <For each={BACKENDS}>
                                    {(b) => (
                                        <option value={b.id} disabled={!availableBackends().includes(b.id)}>
                                            {t(b.label)}
                                            {availableBackends().includes(b.id) ? '' : ` (${t('ad.llmBackendUnavailable')})`}
                                        </option>
                                    )}
                                </For>
                            </select>
                            <span class="block text-xs text-muted-foreground mt-1">{t('ad.llmBackendHint')}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving()}
                            class="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50"
                        >
                            {isSaving() ? t('au.memproses') : t('ad.save')}
                        </button>
                    </form>
                </Show>
            </main>
        </div>
    );
}
