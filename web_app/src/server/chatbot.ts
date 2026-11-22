// The administrator's regulation chatbot (RAG). Reads go through apiFetch; answers stream through
// routes/api/administrator/ask.ts, which uses `parseAskSettings` to whitelist what is forwarded.
import { markSafeError } from '@solidjs/web';

import { apiFetch } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;

export interface AskSettings {
  question: string;
  top_k: number;
  include_revoked: boolean;
  search_mode: 'hybrid' | 'dense';
  rerank: boolean;
  temperature: number;
  max_new_tokens: number;
  conversation_id: string | null;
}

const clamp = (v: unknown, min: number, max: number, fallback: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Whitelist and clamp the browser's request before it reaches the API. */
export function parseAskSettings(input: Raw): AskSettings {
  const question = typeof input.question === 'string' ? input.question.trim() : '';
  if (!question || question.length > 4000) throw markSafeError(new Error('Invalid question'));
  const conversation = typeof input.conversation_id === 'string' && isUuid(input.conversation_id) ? input.conversation_id : null;
  return {
    question,
    top_k: Math.round(clamp(input.top_k, 1, 10, 3)),
    include_revoked: input.include_revoked === true,
    search_mode: input.search_mode === 'dense' ? 'dense' : 'hybrid',
    rerank: input.rerank !== false,
    temperature: clamp(input.temperature, 0, 1, 0.2),
    max_new_tokens: Math.round(clamp(input.max_new_tokens, 16, 1024, 400)),
    conversation_id: conversation,
  };
}

export async function loadChatStatus(auth: AuthState): Promise<Raw> {
  requireAdministrator(auth);
  return apiFetch<Raw>('ai/rag/status');
}

export async function loadConversations(auth: AuthState): Promise<{ id: string; title?: string | null; updated_at: string }[]> {
  requireAdministrator(auth);
  const res = await apiFetch<Raw>('ai/rag/conversations');
  return Array.isArray(res?.conversations) ? res.conversations : [];
}

export async function loadConversation(auth: AuthState, id: string): Promise<{ turns: Raw[] }> {
  requireAdministrator(auth);
  if (!isUuid(id)) throw markSafeError(new Error('Not found'));
  const res = await apiFetch<Raw>(`ai/rag/conversations/${encodeURIComponent(id)}`);
  return { turns: Array.isArray(res?.turns) ? res.turns : [] };
}

export async function removeConversation(auth: AuthState, id: string): Promise<void> {
  requireAdministrator(auth);
  if (!isUuid(id)) throw markSafeError(new Error('Not found'));
  await apiFetch(`ai/rag/conversations/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
