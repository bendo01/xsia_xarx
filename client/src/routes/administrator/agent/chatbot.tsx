import { createEffect, createSignal, For, onMount, Show } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    RagControllerAsk,
    RagControllerConversation,
    RagControllerConversations,
    RagControllerDeleteConversation,
    type RagConversationSummary,
    RagControllerFeedback,
    RagControllerRetrieve,
    RagControllerStatus,
    type RagDone,
    type RagHit,
    type RagStatus,
} from '~/controllers/ai/RagController';
import { t } from '../../../i18n';
import { Spinner } from '~/components/loader';

type TurnStatus = 'retrieving' | 'generating' | 'done' | 'error' | 'stopped';

interface Turn {
    id: number;
    question: string;
    retrievalOnly: boolean;
    status: TurnStatus;
    answer: string;
    hits: RagHit[];
    retrievalMs?: number;
    stats?: RagDone;
    error?: string;
    messageId?: string | null;
    feedback: -1 | 0 | 1;
    note: string;
}

const SAMPLE_KEYS = ['ragSample1', 'ragSample2', 'ragSample3', 'ragSample4', 'ragSample5'];
const TOP_K_RANGE = { min: 1, max: 10, step: 1 };
const TEMPERATURE_RANGE = { min: 0, max: 1, step: 0.05 };
const MAX_TOKEN_RANGE = { min: 64, max: 1024, step: 64 };
const BODY_PREVIEW_CHARS = 280;

const formatBytes = (bytes?: number | null) => (bytes ? `${(bytes / 1024 / 1024).toFixed(0)} MB` : '-');

export default function AgentChatbotPage() {
    const [status, setStatus] = createSignal<RagStatus | null>(null);
    const [turns, setTurns] = createStore<Turn[]>([]);
    const [question, setQuestion] = createSignal('');
    const [isBusy, setIsBusy] = createSignal(false);
    const [conversationId, setConversationId] = createSignal<string | null>(null);
    const [history, setHistory] = createSignal<RagConversationSummary[]>([]);

    // Settings
    const [retrievalOnly, setRetrievalOnly] = createSignal(false);
    const [topK, setTopK] = createSignal(TOP_K_RANGE.max);
    const [includeRevoked, setIncludeRevoked] = createSignal(false);
    const [searchMode, setSearchMode] = createSignal<'hybrid' | 'dense'>('hybrid');
    const [rerank, setRerank] = createSignal(true);
    const [temperature, setTemperature] = createSignal(0.2);
    const [maxTokens, setMaxTokens] = createSignal(MAX_TOKEN_RANGE.max);
    const [modelId, setModelId] = createSignal('qwen');

    let abortController: AbortController | null = null;
    let scrollRef!: HTMLDivElement;
    let nextId = 1;

    const loadStatus = async () => {
        const res = await RagControllerStatus();
        if (res.is_error || !res.data) toast.danger(res.message || t('ad.ragLoadStatusFailed'));
        else setStatus(res.data);
    };

    const loadHistory = async () => {
        const res = await RagControllerConversations();
        if (res.is_error || !res.data) toast.danger(res.message || t('ad.ragHistoryFailed'));
        else setHistory(res.data);
    };

    onMount(() => {
        void loadStatus();
        void loadHistory();
    });

    // Keep the newest text in view while the answer streams in
    createEffect(() => {
        void turns.length;
        void turns[turns.length - 1]?.answer;
        void turns[turns.length - 1]?.status;
        queueMicrotask(() => scrollRef?.scrollTo({ top: scrollRef.scrollHeight, behavior: 'smooth' }));
    });

    // The model picked in the settings; `status().models` is missing on servers older than the model switch
    const selectedModel = () => status()?.models?.find((m) => m.id === modelId());

    const modelProblem = () => {
        const s = status();
        if (!s) return null;
        if (!s.embedder_present) return t('ad.ragEmbedderMissing');
        if (s.active_chunks + s.revoked_chunks === 0) return t('ad.ragNoChunks');
        if (!retrievalOnly()) {
            const m = selectedModel();
            if (!(m?.model_present ?? s.llm_model_present)) return t('ad.ragModelMissing');
            if (!(m?.tokenizer_present ?? s.tokenizer_present)) return t('ad.ragTokenizerMissing');
        }
        return null;
    };

    const update = (id: number, fn: (turn: Turn) => void) =>
        setTurns(
            produce((all) => {
                const turn = all.find((x) => x.id === id);
                if (turn) fn(turn);
            }),
        );

    const send = async (text: string) => {
        const q = text.trim();
        if (q.length < 3 || isBusy()) return;
        const id = nextId++;
        const onlyRetrieval = retrievalOnly();
        setTurns(turns.length, {
            id,
            question: q,
            retrievalOnly: onlyRetrieval,
            status: 'retrieving',
            answer: '',
            hits: [],
            feedback: 0,
            note: '',
        });
        setQuestion('');
        setIsBusy(true);

        const settings = {
            question: q,
            top_k: topK(),
            include_revoked: includeRevoked(),
            search_mode: searchMode(),
            rerank: rerank(),
            temperature: temperature(),
            max_new_tokens: maxTokens(),
            model: modelId(),
            conversation_id: conversationId(),
        };

        if (onlyRetrieval) {
            const res = await RagControllerRetrieve(settings);
            update(id, (turn) => {
                if (res.is_error || !res.data) {
                    turn.status = 'error';
                    turn.error = res.message;
                } else {
                    turn.status = 'done';
                    turn.hits = res.data.hits;
                    turn.retrievalMs = res.data.retrieval_ms;
                }
            });
            if (res.data?.conversation_id) setConversationId(res.data.conversation_id);
            setIsBusy(false);
            void loadHistory();
            return;
        }

        abortController = new AbortController();
        await RagControllerAsk(
            settings,
            {
                onSources: (data) => {
                    setConversationId(data.conversation_id);
                    update(id, (turn) => {
                        turn.hits = data.hits;
                        turn.retrievalMs = data.retrieval_ms;
                        turn.status = 'generating';
                    });
                },
                onToken: (piece) => update(id, (turn) => (turn.answer += piece)),
                onDone: (data) =>
                    update(id, (turn) => {
                        turn.status = data.finish_reason === 'cancelled' ? 'stopped' : 'done';
                        turn.answer = data.answer;
                        turn.stats = data;
                        turn.messageId = data.message_id;
                    }),
                onError: (message) =>
                    update(id, (turn) => {
                        turn.status = 'error';
                        turn.error = message;
                    }),
            },
            abortController.signal,
        );
        // The stream ended without a `done` event: the user stopped it or the connection dropped
        update(id, (turn) => {
            if (turn.status === 'generating' || turn.status === 'retrieving') turn.status = 'stopped';
        });
        abortController = null;
        setIsBusy(false);
        void loadStatus();
        void loadHistory();
    };

    const stop = () => abortController?.abort();

    const newConversation = () => {
        abortController?.abort();
        setTurns([]);
        setConversationId(null);
        setIsBusy(false);
    };

    const openConversation = async (id: string) => {
        if (id === conversationId() || isBusy()) return;
        const res = await RagControllerConversation(id);
        if (res.is_error || !res.data) {
            toast.danger(res.message || t('ad.ragHistoryFailed'));
            return;
        }
        setTurns(
            res.data.turns.map((x) => ({
                id: nextId++,
                question: x.question,
                retrievalOnly: x.retrieval_only,
                status: x.retrieval_only || x.answer ? 'done' : 'stopped',
                answer: x.answer,
                hits: x.hits,
                messageId: x.message_id,
                feedback: x.feedback,
                note: x.note,
            })),
        );
        // Restore the settings the conversation was last asked with; old conversations have none
        const s = res.data.settings;
        if (s.top_k != null) setTopK(Math.min(TOP_K_RANGE.max, Math.max(TOP_K_RANGE.min, s.top_k)));
        if (s.search_mode) setSearchMode(s.search_mode);
        if (s.rerank != null) setRerank(s.rerank);
        if (s.temperature != null) setTemperature(s.temperature);
        if (s.max_new_tokens != null) setMaxTokens(s.max_new_tokens);
        if (s.model) setModelId(s.model);
        setConversationId(id);
    };

    const removeConversation = async (id: string) => {
        if (!confirm(t('ad.ragHistoryDeleteConfirm'))) return;
        const res = await RagControllerDeleteConversation(id);
        if (res.is_error) {
            toast.danger(res.message || t('ad.ragHistoryFailed'));
            return;
        }
        if (id === conversationId()) newConversation();
        void loadHistory();
    };

    const rate = async (turn: Turn, value: -1 | 1) => {
        if (!turn.messageId) return;
        const next = turn.feedback === value ? 0 : value;
        const res = await RagControllerFeedback(turn.messageId, { feedback: next, note: turn.note });
        if (res.is_error) {
            toast.danger(res.message || t('ad.ragFeedbackFailed'));
            return;
        }
        update(turn.id, (x) => (x.feedback = next));
    };

    const saveNote = async (turn: Turn) => {
        if (!turn.messageId) return;
        const res = await RagControllerFeedback(turn.messageId, { feedback: turn.feedback, note: turn.note });
        if (res.is_error) toast.danger(res.message || t('ad.ragFeedbackFailed'));
        else toast.success(t('ad.ragFeedbackSaved'), 2500);
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void send(question());
        }
    };

    /** Splits an answer into plain text and `[n]` citation markers */
    const segments = (text: string) => text.split(/(\[\d+\])/g).filter((s) => s.length > 0);

    const focusSource = (turnId: number, n: number) => {
        const el = document.getElementById(`rag-source-${turnId}-${n}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.classList.add('ring-2', 'ring-blue-500');
        setTimeout(() => el?.classList.remove('ring-2', 'ring-blue-500'), 1800);
    };

    const selectClass =
        'block w-full p-2 text-xs text-neutral-900 border border-neutral-300 rounded-xs bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white';

    const rangeClass = 'w-full accent-blue-600 cursor-pointer';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <Show when={status()?.llm_enabled !== false} fallback={
                <div class="mx-auto max-w-xl px-4 py-16 text-center space-y-3">
                    <h1 class="text-xl font-bold">{t('ad.llmDisabledTitle')}</h1>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400">{t('ad.llmDisabledDesc')}</p>
                    <a href="/administrator/preference/application" class="inline-block text-sm font-semibold text-blue-600 hover:underline">{t('ad.applicationPreference')}</a>
                </div>
            }>
            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                {/* Page header */}
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/administrator/dashboard" class="hover:text-blue-600 transition-colors">{t('ad.administrator')}</a>
                            <span>/</span>
                            <span>{t('ad.ragBreadcrumbAgent')}</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{t('ad.ragTitle')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight font-mono">{t('ad.ragTitle')}</h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">{t('ad.ragSubtitle')}</p>
                    </div>
                    <div class="mt-4 sm:mt-0">
                        <button
                            type="button"
                            onClick={newConversation}
                            class="px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-xs shadow-xs transition-colors cursor-pointer"
                            id="btn-rag-new-chat"
                        >
                            {t('ad.ragNewChat')}
                        </button>
                    </div>
                </div>

                {/* Status */}
                <Show when={status()}>
                    <div class="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                        <span>
                            {t('ad.ragModel')}: <span class="font-mono">{selectedModel()?.label ?? status()!.llm_model}</span>
                            <Show when={selectedModel()?.model_size ?? status()!.llm_model_size}>
                                {' '}
                                ({formatBytes(selectedModel()?.model_size ?? status()!.llm_model_size)})
                            </Show>
                        </span>
                        <span>
                            {t('ad.ragActiveChunks')}: <span class="font-semibold">{status()!.active_chunks.toLocaleString()}</span>
                        </span>
                        <span>
                            {t('ad.ragRevokedChunks')}: <span class="font-semibold">{status()!.revoked_chunks.toLocaleString()}</span>
                        </span>
                        <span class="text-neutral-500 dark:text-neutral-400">
                            {(selectedModel()?.loaded ?? status()!.llm_loaded) ? t('ad.ragModelLoaded') : t('ad.ragModelColdStart')}
                        </span>
                    </div>
                </Show>
                <Show when={modelProblem()}>
                    <p class="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xs">
                        {modelProblem()}
                    </p>
                </Show>
                <p class="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 rounded-xs">
                    {t('ad.ragCpuNote')} {t('ad.ragSmallModelNote')}
                    <Show when={status() && !status()!.fast_prompt}> {t('ad.ragSlowPrompt')}</Show>
                </p>

                <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    {/* Settings */}
                    <aside class="lg:col-span-1 space-y-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 h-fit">
                        <h2 class="text-sm font-bold">{t('ad.ragSettings')}</h2>
                        <label class="block space-y-1 text-xs">
                            <span class="font-medium">{t('ad.ragMode')}</span>
                            <select
                                class={selectClass}
                                value={retrievalOnly() ? 'retrieval' : 'answer'}
                                onChange={(e) => setRetrievalOnly(e.currentTarget.value === 'retrieval')}
                                id="select-rag-mode"
                            >
                                <option value="answer">{t('ad.ragModeAnswer')}</option>
                                <option value="retrieval">{t('ad.ragModeRetrieval')}</option>
                            </select>
                        </label>
                        <label class="block space-y-1 text-xs">
                            <span class="flex justify-between">
                                <span class="font-medium">{t('ad.ragTopK')}</span>
                                <span class="font-mono">{topK()}</span>
                            </span>
                            <input
                                type="range"
                                class={rangeClass}
                                min={TOP_K_RANGE.min}
                                max={TOP_K_RANGE.max}
                                step={TOP_K_RANGE.step}
                                value={topK()}
                                onInput={(e) => setTopK(Number(e.currentTarget.value))}
                                id="input-rag-top-k"
                            />
                        </label>
                        <label class="block space-y-1 text-xs">
                            <span class="font-medium">{t('ad.ragSearchMode')}</span>
                            <select
                                class={selectClass}
                                value={searchMode()}
                                onChange={(e) => setSearchMode(e.currentTarget.value as 'hybrid' | 'dense')}
                                id="select-rag-search-mode"
                            >
                                <option value="hybrid">{t('ad.ragSearchModeHybrid')}</option>
                                <option value="dense">{t('ad.ragSearchModeDense')}</option>
                            </select>
                        </label>
                        <Show when={!retrievalOnly()}>
                            <Show when={(status()?.models?.length ?? 0) > 1}>
                                <label class="block space-y-1 text-xs">
                                    <span class="font-medium">{t('ad.ragLanguageModel')}</span>
                                    <select
                                        class={selectClass}
                                        value={modelId()}
                                        onChange={(e) => setModelId(e.currentTarget.value)}
                                        id="select-rag-model"
                                    >
                                        <For each={status()!.models}>
                                            {(m) => (
                                                <option value={m.id}>
                                                    {m.id === 'gemma' ? 'Gemma 3 4B' : 'Qwen 2.5 1.5B'}
                                                    {m.model_present && m.tokenizer_present ? '' : ' (n/a)'}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </label>
                            </Show>
                            <label class="block space-y-1 text-xs">
                                <span class="flex justify-between">
                                    <span class="font-medium">{t('ad.ragTemperature')}</span>
                                    <span class="font-mono">{temperature().toFixed(2)}</span>
                                </span>
                                <input
                                    type="range"
                                    class={rangeClass}
                                    min={TEMPERATURE_RANGE.min}
                                    max={TEMPERATURE_RANGE.max}
                                    step={TEMPERATURE_RANGE.step}
                                    value={temperature()}
                                    onInput={(e) => setTemperature(Number(e.currentTarget.value))}
                                    id="input-rag-temperature"
                                />
                            </label>
                            <label class="block space-y-1 text-xs">
                                <span class="flex justify-between">
                                    <span class="font-medium">{t('ad.ragMaxTokens')}</span>
                                    <span class="font-mono">{maxTokens()}</span>
                                </span>
                                <input
                                    type="range"
                                    class={rangeClass}
                                    min={MAX_TOKEN_RANGE.min}
                                    max={MAX_TOKEN_RANGE.max}
                                    step={MAX_TOKEN_RANGE.step}
                                    value={maxTokens()}
                                    onInput={(e) => setMaxTokens(Number(e.currentTarget.value))}
                                    id="input-rag-max-tokens"
                                />
                            </label>
                        </Show>
                        <label class="flex items-center gap-2 text-xs cursor-pointer">
                            <input type="checkbox" checked={includeRevoked()} onChange={(e) => setIncludeRevoked(e.currentTarget.checked)} />
                            <span>{t('ad.ragIncludeRevoked')}</span>
                        </label>
                        <Show when={searchMode() === 'hybrid'}>
                            <label class="flex items-center gap-2 text-xs cursor-pointer">
                                <input type="checkbox" checked={rerank()} onChange={(e) => setRerank(e.currentTarget.checked)} />
                                <span>{t('ad.ragRerank')}</span>
                            </label>
                        </Show>
                        <div class="pt-3 mt-1 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                            <h2 class="text-sm font-bold">{t('ad.ragHistory')}</h2>
                            <Show
                                when={history().length > 0}
                                fallback={<p class="text-xs text-neutral-500 dark:text-neutral-400">{t('ad.ragHistoryEmpty')}</p>}
                            >
                                <ul class="space-y-1 max-h-64 overflow-y-auto">
                                    <For each={history()}>
                                        {(item) => (
                                            <li
                                                class="group flex items-center gap-1 border rounded-xs"
                                                classList={{
                                                    'border-blue-500 bg-blue-50 dark:bg-blue-950/50': item.id === conversationId(),
                                                    'border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-700': item.id !== conversationId(),
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => void openConversation(item.id)}
                                                    class="flex-1 min-w-0 text-left px-2 py-1.5 cursor-pointer"
                                                    title={item.title ?? ''}
                                                >
                                                    <span class="block truncate text-xs">{item.title || '-'}</span>
                                                    <span class="block text-[10px] text-neutral-500 dark:text-neutral-400">
                                                        {new Date(item.updated_at).toLocaleString()}
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => void removeConversation(item.id)}
                                                    class="px-2 py-1 text-xs text-neutral-400 hover:text-red-600 cursor-pointer"
                                                    aria-label={t('ad.ragHistoryDelete')}
                                                    title={t('ad.ragHistoryDelete')}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        )}
                                    </For>
                                </ul>
                            </Show>
                        </div>
                    </aside>

                    {/* Conversation */}
                    <section class="lg:col-span-3 flex flex-col border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 min-h-[60vh]">
                        <div ref={scrollRef} class="flex-1 overflow-y-auto p-4 space-y-6 max-h-[65vh]" id="rag-conversation">
                            <Show
                                when={turns.length > 0}
                                fallback={
                                    <div class="py-10 text-center space-y-4">
                                        <p class="text-sm text-neutral-500 dark:text-neutral-400">{t('ad.ragEmptyState')}</p>
                                        <div>
                                            <p class="text-xs font-semibold mb-2">{t('ad.ragSamples')}</p>
                                            <div class="flex flex-wrap justify-center gap-2">
                                                <For each={SAMPLE_KEYS}>
                                                    {(key) => (
                                                        <button
                                                            type="button"
                                                            onClick={() => setQuestion(t(`ad.${key}`))}
                                                            class="px-3 py-1.5 text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xs cursor-pointer transition-colors"
                                                        >
                                                            {t(`ad.${key}`)}
                                                        </button>
                                                    )}
                                                </For>
                                            </div>
                                        </div>
                                    </div>
                                }
                            >
                                <For each={turns}>
                                    {(turn) => (
                                        <div class="space-y-3">
                                            {/* Question */}
                                            <div class="flex justify-end">
                                                <p class="max-w-[85%] bg-blue-600 text-white text-sm px-3.5 py-2 whitespace-pre-wrap">{turn.question}</p>
                                            </div>

                                            {/* Answer */}
                                            <div class="space-y-2">
                                                <Show when={turn.status === 'retrieving'}>
                                                    <p class="flex items-center gap-2 text-xs text-neutral-500">
                                                        <Spinner size="xs" color="blue" aria-hidden={true} />
                                                        <span class="animate-pulse">{t('ad.ragSearching')}</span>
                                                    </p>
                                                </Show>
                                                <Show when={turn.retrievalOnly && turn.status === 'done'}>
                                                    <p class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                                                        {t('ad.ragRetrievalOnlyResult')}
                                                    </p>
                                                </Show>
                                                <Show when={!turn.retrievalOnly && (turn.answer || turn.status === 'generating')}>
                                                    <div class="bg-neutral-100 dark:bg-neutral-900 text-sm px-3.5 py-2.5 whitespace-pre-wrap leading-relaxed">
                                                        <For each={segments(turn.answer)}>
                                                            {(part) => {
                                                                const match = /^\[(\d+)\]$/.exec(part);
                                                                return match ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => focusSource(turn.id, Number(match[1]))}
                                                                        class="mx-0.5 px-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950 hover:bg-blue-200 dark:hover:bg-blue-900 rounded-xs cursor-pointer"
                                                                    >
                                                                        {part}
                                                                    </button>
                                                                ) : (
                                                                    <span>{part}</span>
                                                                );
                                                            }}
                                                        </For>
                                                        <Show when={turn.status === 'generating'}>
                                                            <span class="inline-block w-1.5 h-4 align-middle bg-neutral-500 animate-pulse ml-0.5"></span>
                                                        </Show>
                                                    </div>
                                                    <Show when={turn.status === 'generating' && !turn.answer}>
                                                        <p class="flex items-center gap-2 text-xs text-neutral-500">
                                                            <Spinner size="xs" color="blue" aria-hidden={true} />
                                                            <span class="animate-pulse">{t('ad.ragGenerating')}</span>
                                                        </p>
                                                    </Show>
                                                </Show>
                                                <Show when={turn.status === 'stopped'}>
                                                    <p class="text-xs text-amber-700 dark:text-amber-400">{t('ad.ragStopped')}</p>
                                                </Show>
                                                <Show when={turn.status === 'error'}>
                                                    <p class="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 rounded-xs">
                                                        {turn.error}
                                                    </p>
                                                </Show>

                                                {/* Stats */}
                                                <Show when={turn.retrievalMs !== undefined}>
                                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {t('ad.ragRetrievalMs')}: {turn.retrievalMs} ms
                                                        <Show when={turn.stats}>
                                                            {' · '}
                                                            {turn.stats!.new_tokens} {t('ad.ragTokens')} · {turn.stats!.tokens_per_second.toFixed(1)}{' '}
                                                            {t('ad.ragSpeed')} · {(turn.stats!.generation_ms / 1000).toFixed(1)} s
                                                        </Show>
                                                    </p>
                                                </Show>
                                                <Show when={turn.stats?.finish_reason === 'length'}>
                                                    <p class="text-xs text-amber-700 dark:text-amber-400">{t('ad.ragFinishLength')}</p>
                                                </Show>

                                                {/* Feedback */}
                                                <Show when={turn.messageId && turn.status === 'done'}>
                                                    <div class="flex flex-wrap items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => rate(turn, 1)}
                                                            title={t('ad.ragFeedbackGood')}
                                                            class={`px-2.5 py-1 text-xs border rounded-xs cursor-pointer transition-colors ${turn.feedback === 1 ? 'bg-green-600 text-white border-green-600' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                                                        >
                                                            👍 {t('ad.ragFeedbackGood')}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => rate(turn, -1)}
                                                            title={t('ad.ragFeedbackBad')}
                                                            class={`px-2.5 py-1 text-xs border rounded-xs cursor-pointer transition-colors ${turn.feedback === -1 ? 'bg-red-600 text-white border-red-600' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'}`}
                                                        >
                                                            👎 {t('ad.ragFeedbackBad')}
                                                        </button>
                                                        <Show when={turn.feedback !== 0}>
                                                            <input
                                                                type="text"
                                                                value={turn.note}
                                                                onInput={(e) => update(turn.id, (x) => (x.note = e.currentTarget.value))}
                                                                placeholder={t('ad.ragFeedbackNote')}
                                                                class="flex-1 min-w-40 p-1.5 text-xs border border-neutral-300 rounded-xs bg-white dark:bg-neutral-800 dark:border-neutral-700"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => saveNote(turn)}
                                                                class="px-2.5 py-1 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                            >
                                                                {t('ad.ragFeedbackSave')}
                                                            </button>
                                                        </Show>
                                                    </div>
                                                </Show>

                                                {/* Sources */}
                                                <Show when={turn.status !== 'retrieving' && turn.status !== 'error'}>
                                                    <details class="group" open={turn.retrievalOnly}>
                                                        <summary class="cursor-pointer text-xs font-semibold text-neutral-700 dark:text-neutral-300 select-none">
                                                            {t('ad.ragSources')} ({turn.hits.length})
                                                        </summary>
                                                        <div class="mt-2 space-y-2">
                                                            <Show when={turn.hits.length === 0}>
                                                                <p class="text-xs text-neutral-500">{t('ad.ragNoSources')}</p>
                                                            </Show>
                                                            <For each={turn.hits}>
                                                                {(hit, i) => <SourceCard turnId={turn.id} n={i() + 1} hit={hit} />}
                                                            </For>
                                                        </div>
                                                    </details>
                                                </Show>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </Show>
                        </div>

                        {/* Input */}
                        <div class="border-t border-neutral-200 dark:border-neutral-700 p-3 flex items-end gap-2">
                            <textarea
                                rows={2}
                                value={question()}
                                onInput={(e) => setQuestion(e.currentTarget.value)}
                                onKeyDown={onKeyDown}
                                placeholder={t('ad.ragPlaceholder')}
                                maxLength={1000}
                                class="flex-1 p-2.5 text-sm border border-neutral-300 rounded-xs bg-white text-neutral-900 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white resize-none"
                                id="textarea-rag-question"
                            />
                            <Show
                                when={!isBusy()}
                                fallback={
                                    <button
                                        type="button"
                                        onClick={stop}
                                        class="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xs cursor-pointer transition-colors"
                                        id="btn-rag-stop"
                                    >
                                        {t('ad.ragStop')}
                                    </button>
                                }
                            >
                                <button
                                    type="button"
                                    onClick={() => send(question())}
                                    disabled={question().trim().length < 3 || modelProblem() !== null}
                                    class="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xs cursor-pointer transition-colors"
                                    id="btn-rag-send"
                                >
                                    {t('ad.ragSend')}
                                </button>
                            </Show>
                        </div>
                    </section>
                </div>
            </div>
            </Show>
        </div>
    );
}

/** One retrieved chunk with its regulation, status and score */
function SourceCard(props: { turnId: number; n: number; hit: RagHit }) {
    const [expanded, setExpanded] = createSignal(false);
    const long = () => props.hit.body.length > BODY_PREVIEW_CHARS;
    const text = () => (expanded() || !long() ? props.hit.body : `${props.hit.body.slice(0, BODY_PREVIEW_CHARS)}...`);
    const revoked = () => props.hit.status !== 'active';

    return (
        <div
            id={`rag-source-${props.turnId}-${props.n}`}
            class="border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/60 p-3 text-xs space-y-1.5 transition-shadow"
        >
            <div class="flex flex-wrap items-center gap-2">
                <span class="font-semibold text-blue-700 dark:text-blue-300">[{props.n}]</span>
                <span class="font-medium">{props.hit.citation}</span>
                <span
                    class={
                        revoked()
                            ? 'px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            : 'px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                    }
                >
                    {revoked() ? t('ad.ragStatusRevoked') : t('ad.ragStatusActive')}
                </span>
                <span class="text-neutral-500 dark:text-neutral-400 ml-auto">
                    {t('ad.ragScore')}: {props.hit.score.toFixed(3)}
                </span>
            </div>
            <p class="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{text()}</p>
            <Show when={long()}>
                <button type="button" onClick={() => setExpanded(!expanded())} class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                    {expanded() ? t('ad.ragShowLess') : t('ad.ragShowMore')}
                </button>
            </Show>
        </div>
    );
}
