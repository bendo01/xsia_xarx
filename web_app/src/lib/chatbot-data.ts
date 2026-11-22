import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadChatStatus, loadConversation, loadConversations, removeConversation } from '../server/chatbot';

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
