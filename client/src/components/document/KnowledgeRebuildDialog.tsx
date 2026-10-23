import { createEffect, createSignal, For, onCleanup, Show } from 'solid-js';
import { toast } from '~/components/toast/Toaster';
import {
    DocumentArchiveControllerKnowledgeRebuild,
    DocumentArchiveControllerKnowledgeStatus,
    type KnowledgeRebuildResult,
    type KnowledgeStatus,
} from '~/controllers/document/DocumentArchiveController';
import RegulationRebuildPanel from './RegulationRebuildPanel';
import { t } from '../../i18n';

const POLL_INTERVAL_MS = 5000;

interface Props {
    open: boolean;
    onClose: () => void;
}

/** Lets an administrator re-convert and re-embed the PDF archives marked as knowledge base. */
export default function KnowledgeRebuildDialog(props: Props) {
    let dialogRef!: HTMLDialogElement;
    const [status, setStatus] = createSignal<KnowledgeStatus | null>(null);
    const [isLoading, setIsLoading] = createSignal(false);
    const [isStarting, setIsStarting] = createSignal(false);
    const [selected, setSelected] = createSignal<Set<string>>(new Set());
    const [result, setResult] = createSignal<KnowledgeRebuildResult | null>(null);
    const [tab, setTab] = createSignal<'archives' | 'regulations'>('archives');

    const loadStatus = async (silent = false) => {
        if (!silent) setIsLoading(true);
        const res = await DocumentArchiveControllerKnowledgeStatus();
        if (res.is_error || !res.data) {
            if (!silent) toast.danger(res.message || t('ad.kbStatusLoadFailed'));
        } else {
            setStatus(res.data);
        }
        if (!silent) setIsLoading(false);
    };

    // Open/close the native dialog with the `open` prop; poll while it is open so chunk counts update as jobs finish
    createEffect(() => {
        if (props.open) {
            if (!dialogRef.open) dialogRef.showModal();
            setResult(null);
            setTab('archives');
            setSelected(new Set<string>());
            void loadStatus();
            const timer = setInterval(() => loadStatus(true), POLL_INTERVAL_MS);
            onCleanup(() => clearInterval(timer));
        } else if (dialogRef?.open) {
            dialogRef.close();
        }
    });

    const items = () => status()?.items ?? [];
    const allSelected = () => items().length > 0 && selected().size === items().length;

    const toggleAll = (checked: boolean) =>
        setSelected(checked ? new Set(items().map((i) => i.id)) : new Set<string>());

    const toggleOne = (id: string, checked: boolean) => {
        const next = new Set(selected());
        if (checked) next.add(id);
        else next.delete(id);
        setSelected(next);
    };

    const start = async () => {
        setIsStarting(true);
        const res = await DocumentArchiveControllerKnowledgeRebuild({ ids: [...selected()] });
        setIsStarting(false);
        if (res.is_error || !res.data) {
            toast.danger(res.message || t('ad.kbRebuildFailed'), 8000);
            return;
        }
        setResult(res.data);
        toast.success(`${res.data.queued} ${t('ad.kbQueuedResult')}`, 5000);
        void loadStatus(true);
    };

    const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : t('ad.kbNotIndexed'));

    const startDisabled = () =>
        isStarting() || selected().size === 0 || status()?.docling_available === false;

    return (
        <dialog
            ref={dialogRef}
            class="fixed inset-0 m-auto p-0 rounded-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-3xl w-full"
            onClose={() => props.onClose()}
            onClick={(e) => {
                if (e.target === e.currentTarget) props.onClose();
            }}
        >
            <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 space-y-4">
                <div>
                    <h3 class="text-lg font-bold">{t('ad.kbRebuildTitle')}</h3>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{t('ad.kbRebuildDescription')}</p>
                </div>

                <div class="flex border-b border-neutral-200 dark:border-neutral-700 text-sm">
                    <button
                        type="button"
                        onClick={() => setTab('archives')}
                        class={`px-4 py-2 -mb-px border-b-2 cursor-pointer ${tab() === 'archives' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        id="tab-knowledge-archives"
                    >
                        {t('ad.kbTabArchives')}
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('regulations')}
                        class={`px-4 py-2 -mb-px border-b-2 cursor-pointer ${tab() === 'regulations' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        id="tab-knowledge-regulations"
                    >
                        {t('ad.kbTabRegulations')}
                    </button>
                </div>

                <Show when={tab() === 'archives'}>
                    <p class="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xs">
                        {t('ad.kbRebuildWarning')}
                    </p>

                    <Show when={status()?.docling_available === false}>
                        <p class="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xs">
                            {t('ad.kbDoclingMissing')}
                        </p>
                    </Show>

                    <Show when={status()}>
                        <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                            <span>
                                {t('ad.kbTotalChunks')}: <span class="font-semibold">{status()!.total_chunks.toLocaleString()}</span>
                            </span>
                            <span>
                                {t('ad.kbQueueWaiting')}: <span class="font-semibold">{status()!.queue_length}</span>
                            </span>
                            <Show when={status()!.queue_length > 0}>
                                <span class="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                    <span class="size-2 rounded-full bg-blue-500 animate-pulse"></span>
                                    {t('ad.kbRebuildTitle')}...
                                </span>
                            </Show>
                        </div>
                    </Show>

                    <div class="border border-neutral-200 dark:border-neutral-700 max-h-80 overflow-y-auto">
                        <table class="w-full text-xs sm:text-sm text-left">
                            <thead class="sticky top-0 text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th class="px-3 py-2.5 w-10">
                                        <input
                                            type="checkbox"
                                            aria-label={t('ad.kbSelectAll')}
                                            checked={allSelected()}
                                            disabled={items().length === 0}
                                            onChange={(e) => toggleAll(e.currentTarget.checked)}
                                        />
                                    </th>
                                    <th class="px-3 py-2.5 font-semibold">{t('ad.documentName')}</th>
                                    <th class="px-3 py-2.5 font-semibold text-right">{t('ad.kbColumnChunks')}</th>
                                    <th class="px-3 py-2.5 font-semibold">{t('ad.kbLastIndexed')}</th>
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
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="4" class="px-3 py-8 text-center text-neutral-500">{t('ad.kbNoKnowledgeArchives')}</td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                                                    <td class="px-3 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected().has(item.id)}
                                                            onChange={(e) => toggleOne(item.id, e.currentTarget.checked)}
                                                        />
                                                    </td>
                                                    <td class="px-3 py-2 font-mono text-xs break-all">{item.name}</td>
                                                    <td class="px-3 py-2 text-right">
                                                        <span
                                                            class={
                                                                item.chunk_count === 0
                                                                    ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                                                    : ''
                                                            }
                                                        >
                                                            {item.chunk_count.toLocaleString()}
                                                        </span>
                                                    </td>
                                                    <td class="px-3 py-2 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                                        {formatDate(item.last_indexed_at)}
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>

                    <Show when={result()}>
                        <div class="text-xs border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 text-green-800 dark:text-green-300 p-3 rounded-xs space-y-1">
                            <p class="font-semibold">
                                {result()!.queued} {t('ad.kbQueuedResult')}
                            </p>
                            <Show when={result()!.skipped.length > 0}>
                                <p class="font-semibold text-red-700 dark:text-red-300">{t('ad.kbSkippedHeading')}:</p>
                                <ul class="list-disc pl-5 text-red-700 dark:text-red-300">
                                    <For each={result()!.skipped}>
                                        {(s) => (
                                            <li>
                                                <span class="font-mono">{s.name}</span>: {s.reason}
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </Show>
                        </div>
                    </Show>

                    <div class="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-2">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">
                            {selected().size} / {items().length} {t('ad.kbSelectedCount')}. {t('ad.kbConfirmAll')}
                        </span>
                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => loadStatus()}
                                class="px-3 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xs transition-colors cursor-pointer"
                            >
                                {t('ad.kbRefresh')}
                            </button>
                            <button
                                type="button"
                                onClick={() => props.onClose()}
                                class="px-3 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xs transition-colors cursor-pointer"
                            >
                                {t('ad.kbClose')}
                            </button>
                            <button
                                type="button"
                                onClick={start}
                                disabled={startDisabled()}
                                class="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xs transition-colors cursor-pointer"
                                id="btn-start-knowledge-rebuild"
                            >
                                {isStarting() ? t('ad.kbStarting') : t('ad.kbStartRebuild')}
                            </button>
                        </div>
                    </div>

                </Show>

                <Show when={tab() === 'regulations'}>
                    <RegulationRebuildPanel />
                </Show>
            </div>
        </dialog>
    );
}
