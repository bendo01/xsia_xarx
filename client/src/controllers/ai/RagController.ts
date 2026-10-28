import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'ai/rag';

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (typeof window !== 'undefined') {
        const token = getStorageItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

export interface RagLlmModel {
    /** `qwen` or `gemma`, sent as `model` when asking */
    id: string;
    label: string;
    model_present: boolean;
    model_size?: number | null;
    tokenizer_present: boolean;
    loaded: boolean;
}

export interface RagStatus {
    llm_model: string;
    llm_model_present: boolean;
    llm_model_size?: number | null;
    tokenizer_present: boolean;
    /** `CANDLE_DEQUANTIZE_ALL` is on: prompts are read much faster, answers a bit slower */
    fast_prompt: boolean;
    llm_loaded: boolean;
    embedder_present: boolean;
    models: RagLlmModel[];
    active_chunks: number;
    revoked_chunks: number;
}

export interface RagHit {
    chunk_id: string;
    regulation_id: string;
    regulation: string;
    number?: string | null;
    year?: number | null;
    /** `active` or `revoked` */
    status: string;
    heading?: string | null;
    citation: string;
    body: string;
    score: number;
}

export interface RagSettings {
    question: string;
    top_k: number;
    include_revoked: boolean;
    rerank: boolean;
    temperature: number;
    max_new_tokens: number;
    model?: string;
    conversation_id?: string | null;
}

export interface RagSources {
    conversation_id: string;
    retrieval_ms: number;
    hits: RagHit[];
}

export interface RagDone {
    message_id?: string | null;
    conversation_id: string;
    answer: string;
    prompt_tokens: number;
    new_tokens: number;
    retrieval_ms: number;
    prompt_ms: number;
    generation_ms: number;
    tokens_per_second: number;
    /** `stop`, `length` or `cancelled` */
    finish_reason: string;
    model: string;
    model_id?: string;
}

type Result<T> = { is_error: boolean; message: string; data?: T };

const failure = async (res: Response, fallback: string) => {
    const body = await res.json().catch(() => ({}));
    return { is_error: true as const, message: body.message || body.brief || body.detail || fallback };
};

export async function RagControllerStatus(): Promise<Result<RagStatus>> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/status`, { method: 'GET', headers: getHeaders() });
        if (!res.ok) return await failure(res, 'Failed to load the RAG status.');
        return { is_error: false, message: '', data: (await res.json()) as RagStatus };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while loading the RAG status.' };
    }
}

/** Retrieval only: the chunks the chatbot would be given, without running the language model */
export async function RagControllerRetrieve(
    settings: RagSettings,
): Promise<Result<{ hits: RagHit[]; retrieval_ms: number; conversation_id?: string | null }>> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/retrieve`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(settings),
        });
        if (!res.ok) return await failure(res, 'Retrieval failed.');
        return { is_error: false, message: '', data: await res.json() };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error during retrieval.' };
    }
}

export interface RagAskHandlers {
    onSources: (data: RagSources) => void;
    onToken: (text: string) => void;
    onDone: (data: RagDone) => void;
    onError: (message: string) => void;
}

/**
 * Asks a question and reads the answer as server-sent events. `fetch` is used instead of `EventSource`
 * because the request is a POST that carries the bearer token. Resolves when the stream ends or is aborted.
 */
export async function RagControllerAsk(
    settings: RagSettings,
    handlers: RagAskHandlers,
    signal: AbortSignal,
): Promise<void> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/ask`, {
            method: 'POST',
            headers: { ...getHeaders(), Accept: 'text/event-stream' },
            body: JSON.stringify(settings),
            signal,
        });
        if (!res.ok || !res.body) {
            handlers.onError((await failure(res, 'The question could not be answered.')).message);
            return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
            let end: number;
            while ((end = buffer.indexOf('\n\n')) >= 0) {
                const block = buffer.slice(0, end);
                buffer = buffer.slice(end + 2);
                dispatch(block, handlers);
            }
        }
    } catch (error: any) {
        if (error?.name !== 'AbortError') handlers.onError(error.message || 'Network error while asking.');
    }
}

function dispatch(block: string, handlers: RagAskHandlers) {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (data.length === 0) return;
    let payload: any;
    try {
        payload = JSON.parse(data.join('\n'));
    } catch {
        return;
    }
    if (event === 'sources') handlers.onSources(payload);
    else if (event === 'token') handlers.onToken(payload.text ?? '');
    else if (event === 'done') handlers.onDone(payload);
    else if (event === 'error') handlers.onError(payload.message ?? 'Error');
}

/** Rates an answer: 1 good, -1 bad, 0 cleared */
export async function RagControllerFeedback(
    messageId: string,
    props: { feedback: -1 | 0 | 1; note?: string },
): Promise<Result<undefined>> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/messages/${messageId}/feedback`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(props),
        });
        if (!res.ok) return await failure(res, 'Failed to save the feedback.');
        return { is_error: false, message: '' };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while saving the feedback.' };
    }
}

export interface RagConversationSummary {
    id: string;
    title?: string | null;
    updated_at: string;
}

export interface RagStoredTurn {
    question: string;
    answer: string;
    hits: RagHit[];
    message_id?: string | null;
    feedback: -1 | 0 | 1;
    note: string;
    /** A lookup without an answer, stored by the "retrieval only" mode */
    retrieval_only: boolean;
}

/** The signed-in user's conversations, newest first */
export async function RagControllerConversations(): Promise<Result<RagConversationSummary[]>> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/conversations`, { method: 'GET', headers: getHeaders() });
        if (!res.ok) return await failure(res, 'Failed to load the conversation history.');
        const body = await res.json();
        return { is_error: false, message: '', data: body.conversations as RagConversationSummary[] };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while loading the history.' };
    }
}

/** The turns of one stored conversation, with the sources each answer was given */
export async function RagControllerConversation(id: string): Promise<Result<RagStoredTurn[]>> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/conversations/${id}`, { method: 'GET', headers: getHeaders() });
        if (!res.ok) return await failure(res, 'Failed to load the conversation.');
        const body = await res.json();
        return { is_error: false, message: '', data: body.turns as RagStoredTurn[] };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while loading the conversation.' };
    }
}

export async function RagControllerDeleteConversation(id: string): Promise<Result<undefined>> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/conversations/${id}`, { method: 'DELETE', headers: getHeaders() });
        if (!res.ok) return await failure(res, 'Failed to delete the conversation.');
        return { is_error: false, message: '' };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while deleting the conversation.' };
    }
}
