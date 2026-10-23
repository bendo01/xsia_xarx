import { createSignal, For, onCleanup, onMount, Show } from 'solid-js';
import { toast } from '~/components/toast/Toaster';
import {
    RegulationKnowledgeRebuild,
    RegulationKnowledgeStatus,
    type RegulationRebuildResult,
    type RegulationStatus,
} from '~/controllers/document/DocumentArchiveController';
import { t } from '../../i18n';

const POLL_INTERVAL_MS = 4000;

/** Registers and embeds the PDFs of the server's regulation folder (same job as `compliance:ingest-regulations`). */
export default function RegulationRebuildPanel() {
    const [status, setStatus] = createSignal<RegulationStatus | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isStarting, setIsStarting] = createSignal(false);
    const [force, setForce] = createSignal(false);
    const [result, setResult] = createSignal<RegulationRebuildResult | null>(null);

    const loadStatus = async (silent = false) => {
        const res = await RegulationKnowledgeStatus();
        if (res.is_error || !res.data) {
            if (!silent) toast.danger(res.message || t('ad.kbStatusLoadFailed'));
        } else {
            setStatus(res.data);
        }
        if (!silent) setIsLoading(false);
    };

    onMount(() => {
        void loadStatus();
        const timer = setInterval(() => void loadStatus(true), POLL_INTERVAL_MS);
        onCleanup(() => clearInterval(timer));
    });

    const queueLength = () => status()?.queue_length ?? 0;
    const running = () => queueLength() > 0;

    const reasonText = (reason: string) =>
        reason === 'already embedded'
            ? t('ad.kbRegReasonEmbedded')
            : reason === 'already in the queue'
              ? t('ad.kbRegReasonQueued')
              : reason;

    const start = async () => {
        setIsStarting(true);
        const res = await RegulationKnowledgeRebuild({ force: force() });
        setIsStarting(false);
        if (res.is_error || !res.data) {
            toast.danger(res.message || t('ad.kbRebuildFailed'), 8000);
            return;
        }
        setResult(res.data);
        toast.success(`${res.data.queued} ${t('ad.kbRegQueuedResult')}`, 4000);
        void loadStatus(true);
    };

    const startDisabled = () =>
        isStarting() || status()?.docling_available === false || status()?.folder_available === false;

    return (
        <div class="space-y-4">
            <p class="text-xs text-neutral-500 dark:text-neutral-400">{t('ad.kbRegDescription')}</p>

            <Show when={status()?.docling_available === false}>
                <p class="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xs">
                    {t('ad.kbDoclingMissing')}
                </p>
            </Show>
            <Show when={status()?.folder_available === false}>
                <p class="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xs">
                    {t('ad.kbRegFolderMissing')}
                </p>
            </Show>

            <Show when={status()}>
                <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                    <span>
                        {t('ad.kbRegFolderPdfs')}: <span class="font-semibold">{status()!.folder_pdf_count}</span>
                    </span>
                    <span>
                        {t('ad.kbRegRegistered')}: <span class="font-semibold">{status()!.items.length}</span>
                    </span>
                    <span>
                        {t('ad.kbRegIndexed')}: <span class="font-semibold">{status()!.indexed_count}</span>
                    </span>
                    <span>
                        {t('ad.kbTotalChunks')}: <span class="font-semibold">{status()!.total_chunks.toLocaleString()}</span>
                    </span>
                    <Show when={status()!.unregistered.length > 0}>
                        <span class="text-amber-600 dark:text-amber-400">
                            {t('ad.kbRegUnregistered')}: <span class="font-semibold">{status()!.unregistered.length}</span>
                        </span>
                    </Show>
                </div>
            </Show>

            <Show when={running()}>
                <div class="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 p-3 text-xs space-y-1">
                    <p class="font-semibold inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                        <span class="size-2 rounded-full bg-blue-500 animate-pulse"></span>
                        {t('ad.kbRegQueueNote')}: {queueLength()}
                    </p>
                    <p class="text-neutral-600 dark:text-neutral-300">{t('ad.kbRegFailureNote')}</p>
                </div>
            </Show>

            <Show when={result()}>
                <div class="text-xs border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-3 space-y-1">
                    <p class="font-semibold">
                        {result()!.queued} {t('ad.kbRegQueuedResult')}
                    </p>
                    <Show when={result()!.skipped.length > 0}>
                        <p class="font-semibold">{t('ad.kbSkippedHeading')}:</p>
                        <ul class="list-disc pl-5 max-h-24 overflow-y-auto">
                            <For each={result()!.skipped}>
                                {(sk) => (
                                    <li>
                                        <span class="font-mono">{sk.name}</span>: {reasonText(sk.reason)}
                                    </li>
                                )}
                            </For>
                        </ul>
                    </Show>
                </div>
            </Show>

            <div class="border border-neutral-200 dark:border-neutral-700 max-h-64 overflow-y-auto">
                <table class="w-full text-xs sm:text-sm text-left">
                    <thead class="sticky top-0 text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                        <tr>
                            <th class="px-3 py-2.5 font-semibold">{t('ad.kbRegColumnTitle')}</th>
                            <th class="px-3 py-2.5 font-semibold whitespace-nowrap">{t('ad.kbRegColumnNumber')}</th>
                            <th class="px-3 py-2.5 font-semibold">{t('ad.kbRegColumnStatus')}</th>
                            <th class="px-3 py-2.5 font-semibold text-right">{t('ad.kbColumnChunks')}</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                        <Show
                            when={!isLoading()}
                            fallback={
                                <tr>
                                    <td colspan="4" class="px-3 py-8 text-center text-neutral-500">{t('common.loading')}</td>
                                </tr>
                            }
                        >
                            <Show
                                when={(status()?.items.length ?? 0) > 0}
                                fallback={
                                    <tr>
                                        <td colspan="4" class="px-3 py-8 text-center text-neutral-500">{t('ad.kbRegNoItems')}</td>
                                    </tr>
                                }
                            >
                                <For each={status()!.items}>
                                    {(item) => (
                                        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                                            <td class="px-3 py-2 text-xs">{item.title}</td>
                                            <td class="px-3 py-2 text-xs whitespace-nowrap">
                                                {item.number ?? '-'}/{item.year ?? '-'}
                                            </td>
                                            <td class="px-3 py-2">
                                                <span
                                                    class={
                                                        item.status === 'revoked'
                                                            ? 'px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                                            : 'px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                                    }
                                                >
                                                    {item.status === 'revoked' ? t('ad.kbRegStatusRevoked') : t('ad.kbRegStatusActive')}
                                                </span>
                                            </td>
                                            <td class="px-3 py-2 text-right">
                                                <span class={item.chunk_count === 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}>
                                                    {item.chunk_count.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                </For>
                            </Show>
                        </Show>
                    </tbody>
                </table>
            </div>

            <label class="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300 cursor-pointer">
                <input
                    type="checkbox"
                    class="mt-0.5"
                    checked={force()}
                    onChange={(e) => setForce(e.currentTarget.checked)}
                />
                <span>
                    {t('ad.kbRegForce')}
                    <span class="block text-neutral-500 dark:text-neutral-400">{t('ad.kbRegForceHint')}</span>
                </span>
            </label>

            <div class="flex justify-end">
                <button
                    type="button"
                    onClick={start}
                    disabled={startDisabled()}
                    class="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xs transition-colors cursor-pointer"
                    id="btn-start-regulation-rebuild"
                >
                    {isStarting() ? t('ad.kbStarting') : t('ad.kbRegStart')}
                </button>
            </div>
        </div>
    );
}
