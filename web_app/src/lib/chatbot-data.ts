import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadChatStatus, loadConversation, loadConversations, removeConversation, retrieveChunks, sendFeedback } from '../server/chatbot';

export const getChatStatus = query(async () => {
  'use server';
  return loadChatStatus(await requireAuth());
}, 'chat-status');

export const getChatConversations = query(async () => {
  'use server';
  return loadConversations(await requireAuth());
}, 'chat-conversations');

export const getChatConversation = query(async (id: string) => {
  'use server';
  return loadConversation(await requireAuth(), id);
}, 'chat-conversation');

export async function deleteChatConversation(id: string): Promise<void> {
  'use server';
  await removeConversation(await requireAuth(), id);
}

export async function sendChatFeedback(messageId: string, feedback: number, note: string): Promise<void> {
  'use server';
  await sendFeedback(await requireAuth(), messageId, feedback, note);
}

export async function retrieveChat(settings: Record<string, unknown>) {
  'use server';
  const res = await retrieveChunks(await requireAuth(), settings);
  return {
    hits: Array.isArray(res?.hits) ? res.hits : [],
    retrieval_ms: Number(res?.retrieval_ms ?? 0),
    conversation_id: typeof res?.conversation_id === 'string' ? res.conversation_id : null,
  };
}
