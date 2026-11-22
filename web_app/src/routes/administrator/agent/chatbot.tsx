import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { revalidate } from '@solidjs/router';
import { Errored, For, Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../components/student/PageHeader';
import { t } from '../../../i18n';
import { deleteChatConversation, getChatConversation, getChatConversations, getChatStatus, retrieveChat, sendChatFeedback } from '../../../lib/chatbot-data';
import { crudErrorText } from '../../../lib/crud-errors';
import { parseSse } from '../../../lib/sse';

export const route = {
  preload: () => {
    void getChatStatus();
    void getChatConversations();
  },
} satisfies RouteDefinition;

interface Hit { chunk_id: string; citation: string; heading?: string | null; body: string; score: number; status: string }
interface Turn { question: string; answer: string; hits: Hit[]; busy: boolean; error?: string; messageId?: string; feedback: -1 | 0 | 1; note: string; retrievalOnly?: boolean; retrievalMs?: number }
interface Model { id: string; label: string; model_present: boolean }

const field = 'min-h-20 w-full rounded-xs border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** Ask the regulation chatbot; answers stream in with the sources they were given. */
export default function ChatbotPage() {
  const status = createMemo(() => getChatStatus());
  const history = createMemo(() => getChatConversations());
  const [turns, setTurns] = createSignal<Turn[]>([]);
  const [conversationId, setConversationId] = createSignal<string | null>(null);
  const [question, setQuestion] = createSignal('');
  const [topK, setTopK] = createSignal(3);
  const [includeRevoked, setIncludeRevoked] = createSignal(false);
  const [rerank, setRerank] = createSignal(true);
  const [busy, setBusy] = createSignal(false);
  const [retrievalOnly, setRetrievalOnly] = createSignal(false);
  const [searchMode, setSearchMode] = createSignal<'hybrid' | 'dense'>('hybrid');
  const [temperature, setTemperature] = createSignal(0.2);
  const [maxTokens, setMaxTokens] = createSignal(400);
  const [model, setModel] = createSignal('');
  const models = () => ((status().models as Model[] | undefined) ?? []).filter((m) => m.model_present);
  const settings = (q: string) => ({ question: q, top_k: topK(), include_revoked: includeRevoked(), rerank: rerank(), search_mode: searchMode(), temperature: temperature(), max_new_tokens: maxTokens(), model: model() || undefined, conversation_id: conversationId() });
  let abort: AbortController | undefined;

  const patchLast = (f: (turn: Turn) => Turn) => setTurns((ts) => ts.map((x, i) => (i === ts.length - 1 ? f(x) : x)));
  const newChat = () => {
    abort?.abort();
    setTurns([]);
    setConversationId(null);
  };

  const ask = async (e: Event) => {
    e.preventDefault();
    const q = question().trim();
    if (!q || busy()) return;
    setQuestion('');
    setBusy(true);
    setTurns((ts) => [...ts, { question: q, answer: '', hits: [], busy: true, feedback: 0, note: '', retrievalOnly: retrievalOnly() }]);
    abort = new AbortController();
    try {
      if (retrievalOnly()) {
        const found = await retrieveChat(settings(q));
        if (found.conversation_id) setConversationId(found.conversation_id);
        patchLast((x) => ({ ...x, hits: found.hits as Hit[], retrievalMs: found.retrieval_ms, busy: false }));
        await revalidate(getChatConversations.key);
        return;
      }
      const res = await fetch('/api/administrator/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify(settings(q)),
        signal: abort.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || `${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const parsed = parseSse(buffer + decoder.decode(value, { stream: true }));
        buffer = parsed.rest;
        for (const ev of parsed.events) {
          const d = ev.data as Record<string, any>;
          if (ev.event === 'sources') {
            setConversationId(String(d.conversation_id ?? '') || conversationId());
            patchLast((x) => ({ ...x, hits: Array.isArray(d.hits) ? d.hits : [] }));
          } else if (ev.event === 'token') patchLast((x) => ({ ...x, answer: x.answer + String(d.text ?? '') }));
          else if (ev.event === 'done') {
            setConversationId(String(d.conversation_id ?? '') || conversationId());
            patchLast((x) => ({ ...x, answer: typeof d.answer === 'string' && d.answer ? d.answer : x.answer, messageId: typeof d.message_id === 'string' ? d.message_id : x.messageId, busy: false }));
          } else if (ev.event === 'error') patchLast((x) => ({ ...x, busy: false, error: String(d.message ?? 'Error') }));
        }
      }
      patchLast((x) => ({ ...x, busy: false }));
      await revalidate(getChatConversations.key);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') patchLast((x) => ({ ...x, busy: false, error: (err as Error).message }));
      else patchLast((x) => ({ ...x, busy: false }));
    } finally {
      setBusy(false);
    }
  };

  const open = async (id: string) => {
    abort?.abort();
    try {
      const c = await getChatConversation(id);
      setConversationId(id);
      setTurns(c.turns.map((x) => ({ question: String(x.question ?? ''), answer: String(x.answer ?? ''), hits: Array.isArray(x.hits) ? x.hits : [], busy: false, messageId: typeof x.message_id === 'string' ? x.message_id : undefined, feedback: x.feedback === 1 || x.feedback === -1 ? x.feedback : 0, note: typeof x.note === 'string' ? x.note : '', retrievalOnly: x.retrieval_only === true })));
    } catch (err) {
      toast.error(crudErrorText(err, 'cd.saveFailed'));
    }
  };

  const rate = async (index: number, value: -1 | 1) => {
    const turn = turns()[index];
    if (!turn?.messageId) return;
    const next = turn.feedback === value ? 0 : value; // a second click on the same rating clears it
    try {
      await sendChatFeedback(turn.messageId, next, next === 0 ? '' : turn.note);
      setTurns((ts) => ts.map((x, i) => (i === index ? { ...x, feedback: next, note: next === 0 ? '' : x.note } : x)));
      toast.success(t('ad.ragFeedbackSaved'));
    } catch (err) {
      toast.error(crudErrorText(err, 'ad.ragFeedbackFailed'));
    }
  };

  const setNote = (index: number, note: string) => setTurns((ts) => ts.map((x, i) => (i === index ? { ...x, note } : x)));
  const saveNote = async (index: number) => {
    const turn = turns()[index];
    if (!turn?.messageId || turn.feedback === 0) return;
    try {
      await sendChatFeedback(turn.messageId, turn.feedback, turn.note);
      toast.success(t('ad.ragFeedbackSaved'));
    } catch (err) {
      toast.error(crudErrorText(err, 'ad.ragFeedbackFailed'));
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm(t('ad.ragHistoryDeleteConfirm'))) return;
    try {
      await deleteChatConversation(id);
      if (conversationId() === id) newChat();
      await revalidate(getChatConversations.key);
    } catch (err) {
      toast.error(crudErrorText(err, 'cd.deleteFailed'));
    }
  };

  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${t('ad.ragTitle')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={t('ad.ragTitle')} description={t('ad.ragSubtitle')} actions={<button type="button" onClick={newChat} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.ragNewChat')}</button>} />
      <Show
        when={status().llm_enabled}
        fallback={
          <div class="rounded-xs border border-card-line bg-card p-6 text-sm">
            <p class="font-semibold">{t('ad.llmDisabledTitle')}</p>
            <p class="mt-1 text-muted-foreground-1">{t('ad.llmDisabledDesc')}</p>
            <a href="/administrator/preference/application" class="mt-3 inline-block text-primary hover:underline">{t('ad.applicationPreference')}</a>
          </div>
        }
      >
        <div class="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside class="space-y-2">
            <h2 class="text-sm font-semibold">{t('ad.ragHistory')}</h2>
            <Show when={history().length > 0} fallback={<p class="text-xs text-muted-foreground-1">{t('ad.ragHistoryEmpty')}</p>}>
              <ul class="space-y-1">
                <For each={history()}>
                  {(c) => (
                    <li class="flex items-center justify-between gap-2 rounded-xs border border-card-line bg-card px-2 py-1.5 text-sm">
                      <button type="button" class={['min-w-0 flex-1 truncate text-start hover:text-primary', { 'font-semibold': conversationId() === c.id }]} onClick={() => void open(c.id)}>{c.title || c.id.slice(0, 8)}</button>
                      <button type="button" class="text-xs text-destructive hover:underline" onClick={() => void remove(c.id)}>{t('ad.ragHistoryDelete')}</button>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
          </aside>
          <section class="space-y-4">
            <Show when={turns().length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('ad.ragEmptyState')}</p>}>
              <For each={turns()}>
                {(turn, index) => (
                  <article class="space-y-2 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
                    <p class="text-sm font-semibold">{turn.question}</p>
                    <p class="whitespace-pre-wrap text-sm" aria-live="polite">{turn.answer}<Show when={turn.busy}><span class="text-muted-foreground-1"> {t('ad.ragGenerating')}</span></Show></p>
                    <Show when={turn.error}><p role="alert" class="text-sm text-destructive">{turn.error}</p></Show>
                    <Show when={turn.retrievalOnly}><p class="text-xs text-muted-foreground-1">{t('ad.ragRetrievalOnlyResult')}<Show when={turn.retrievalMs !== undefined}> · {t('ad.ragRetrievalMs')}: {turn.retrievalMs}</Show><Show when={!turn.busy && turn.hits.length === 0}> · {t('ad.ragNoChunks')}</Show></p></Show>
                    <Show when={turn.messageId && !turn.busy && !turn.retrievalOnly}>
                      <div class="flex gap-2 text-sm">
                        <button type="button" aria-pressed={turn.feedback === 1 ? 'true' : 'false'} onClick={() => void rate(index(), 1)} class={['rounded-xs border px-2 py-0.5', turn.feedback === 1 ? 'border-primary text-primary' : 'border-layer-line']}>👍 {t('ad.ragFeedbackGood')}</button>
                        <button type="button" aria-pressed={turn.feedback === -1 ? 'true' : 'false'} onClick={() => void rate(index(), -1)} class={['rounded-xs border px-2 py-0.5', turn.feedback === -1 ? 'border-destructive text-destructive' : 'border-layer-line']}>👎 {t('ad.ragFeedbackBad')}</button>
                      </div>
                      <Show when={turn.feedback !== 0}>
                        <form class="flex gap-2 text-sm" onSubmit={(e) => { e.preventDefault(); void saveNote(index()); }}>
                          <input type="text" maxlength={500} value={turn.note} onInput={(e) => setNote(index(), e.currentTarget.value)} placeholder={t('ad.ragFeedbackNote')} class="h-8 min-w-0 flex-1 rounded-xs border border-input bg-card px-2" />
                          <button type="submit" class="h-8 rounded-xs border border-layer-line bg-layer px-3 hover:bg-layer-hover">{t('ad.ragFeedbackSave')}</button>
                        </form>
                      </Show>
                    </Show>
                    <Show when={turn.hits.length > 0}>
                      <details class="text-xs">
                        <summary class="cursor-pointer font-medium">{t('ad.ragSources')} ({turn.hits.length})</summary>
                        <ul class="mt-2 space-y-2">
                          <For each={turn.hits}>
                            {(h) => (
                              <li class="rounded-xs border border-card-divider p-2">
                                <p class="font-medium">{h.citation}<span class="text-muted-foreground-1"> · {t('ad.ragScore')} {h.score.toFixed(2)}</span></p>
                                <p class="mt-1 line-clamp-4 whitespace-pre-wrap text-muted-foreground-1">{h.body}</p>
                              </li>
                            )}
                          </For>
                        </ul>
                      </details>
                    </Show>
                  </article>
                )}
              </For>
            </Show>
            <form onSubmit={(e) => void ask(e)} class="space-y-3 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
              <textarea class={field} placeholder={t('ad.ragPlaceholder')} value={question()} onInput={(e) => setQuestion(e.currentTarget.value)} maxlength={4000} />
              <details class="text-sm">
                <summary class="cursor-pointer font-medium">{t('ad.ragSettings')}</summary>
                <div class="mt-3 grid gap-3 sm:grid-cols-2">
                  <label class="flex items-center gap-2">{t('ad.ragMode')}
                    <select class="h-8 rounded-xs border border-input bg-card px-2" value={retrievalOnly() ? 'retrieval' : 'answer'} onChange={(e) => setRetrievalOnly(e.currentTarget.value === 'retrieval')}>
                      <option value="answer" selected={!retrievalOnly()}>{t('ad.ragModeAnswer')}</option>
                      <option value="retrieval" selected={retrievalOnly()}>{t('ad.ragModeRetrieval')}</option>
                    </select>
                  </label>
                  <label class="flex items-center gap-2">{t('ad.ragSearchMode')}
                    <select class="h-8 rounded-xs border border-input bg-card px-2" value={searchMode()} onChange={(e) => setSearchMode(e.currentTarget.value === 'dense' ? 'dense' : 'hybrid')}>
                      <option value="hybrid" selected={searchMode() === 'hybrid'}>{t('ad.ragSearchModeHybrid')}</option>
                      <option value="dense" selected={searchMode() === 'dense'}>{t('ad.ragSearchModeDense')}</option>
                    </select>
                  </label>
                  <Show when={models().length > 0}>
                    <label class="flex items-center gap-2">{t('ad.ragModel')}
                      <select class="h-8 min-w-0 rounded-xs border border-input bg-card px-2" value={model()} onChange={(e) => setModel(e.currentTarget.value)}>
                        <option value="" selected={model() === ''}>{t('cd.selectOne')}</option>
                        <For each={models()}>{(m) => <option value={m.id} selected={model() === m.id}>{m.label}</option>}</For>
                      </select>
                    </label>
                  </Show>
                  <label class="flex items-center gap-2">{t('ad.ragTemperature')}: {temperature().toFixed(2)}
                    <input type="range" min={0} max={1} step={0.05} value={temperature()} onInput={(e) => setTemperature(Number(e.currentTarget.value))} />
                  </label>
                  <label class="flex items-center gap-2">{t('ad.ragMaxTokens')}: {maxTokens()}
                    <input type="range" min={16} max={1024} step={16} value={maxTokens()} onInput={(e) => setMaxTokens(Number(e.currentTarget.value))} />
                  </label>
                </div>
              </details>
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <label class="flex items-center gap-2">{t('ad.ragTopK')}
                  <input type="number" min={1} max={10} value={topK()} onInput={(e) => setTopK(Number(e.currentTarget.value) || 3)} class="h-8 w-16 rounded-xs border border-input bg-card px-2" />
                </label>
                <label class="flex items-center gap-2"><input type="checkbox" checked={rerank()} onChange={(e) => setRerank(e.currentTarget.checked)} />{t('ad.ragRerank')}</label>
                <label class="flex items-center gap-2"><input type="checkbox" checked={includeRevoked()} onChange={(e) => setIncludeRevoked(e.currentTarget.checked)} />{t('ad.ragIncludeRevoked')}</label>
                <span class="grow" />
                <Show when={busy()} fallback={<button type="submit" disabled={!question().trim()} class="h-9 rounded-xs bg-primary px-4 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{t('ad.ragSend')}</button>}>
                  <button type="button" onClick={() => abort?.abort()} class="h-9 rounded-xs bg-destructive px-4 font-medium text-white hover:opacity-90">{t('ad.ragStop')}</button>
                </Show>
              </div>
            </form>
          </section>
        </div>
      </Show>
    </Errored>
  );
}
