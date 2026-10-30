import { createSignal, onMount, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { PreferenceApplicationShow, PreferenceApplicationUpdate } from '~/controllers/preference/PreferenceApplicationController';
import { t } from '../../../i18n';

export default function PreferenceApplicationPage() {
    const [isLlmEnable, setIsLlmEnable] = createSignal(false);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSaving, setIsSaving] = createSignal(false);

    onMount(async () => {
        const res = await PreferenceApplicationShow();
        if (res.is_error) toast.danger(res.message);
        else setIsLlmEnable(res.data.is_llm_enable);
        setIsLoading(false);
    });

    const save = async (e: SubmitEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const res = await PreferenceApplicationUpdate({ is_llm_enable: isLlmEnable() });
        setIsSaving(false);
        if (res.is_error) toast.danger(res.message);
        else toast.success(t('ad.applicationPreferenceSaved'));
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />
            <main class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <h1 class="text-2xl font-bold tracking-tight font-mono">{t('ad.applicationPreference')}</h1>
                </div>

                <Show when={!isLoading()} fallback={<p class="text-sm text-neutral-500">{t('au.memproses')}</p>}>
                    <form onSubmit={save} class="max-w-lg space-y-4 p-6 bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 rounded-lg">
                        <label class="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                class="mt-1"
                                checked={isLlmEnable()}
                                onChange={(e) => setIsLlmEnable(e.currentTarget.checked)}
                            />
                            <span>
                                <span class="block text-sm font-semibold">{t('ad.llmEnable')}</span>
                                <span class="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('ad.llmEnableHint')}</span>
                            </span>
                        </label>
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
