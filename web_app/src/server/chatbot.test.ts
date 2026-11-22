import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { loadChatStatus, loadConversation, loadConversations, parseAskSettings, removeConversation, retrieveChunks, sendFeedback } from './chatbot';

const ID = '11111111-1111-4111-8111-111111111111';
const as = (activeRole: string) => ({ activeRole }) as AuthState;

describe('parseAskSettings', () => {
  it('applies defaults and trims the question', () => {
    expect(parseAskSettings({ question: '  apa itu SKS?  ' })).toEqual({ question: 'apa itu SKS?', top_k: 3, include_revoked: false, search_mode: 'hybrid', rerank: true, temperature: 0.2, max_new_tokens: 400, conversation_id: null });
  });
  it('clamps numbers, ignores unknown fields and bad conversation ids', () => {
    const s = parseAskSettings({ question: 'q', top_k: 99, temperature: -3, max_new_tokens: 5, conversation_id: 'nope', model: 'bad model', search_mode: 'dense', rerank: false, include_revoked: true });
    expect(s).toMatchObject({ top_k: 10, temperature: 0, max_new_tokens: 16, conversation_id: null, search_mode: 'dense', rerank: false, include_revoked: true });
    expect(s).not.toHaveProperty('model');
    expect(parseAskSettings({ question: 'q', conversation_id: ID }).conversation_id).toBe(ID);
  });
  it('rejects an empty or oversized question', () => {
    expect(() => parseAskSettings({ question: '   ' })).toThrow('Invalid question');
    expect(() => parseAskSettings({ question: 'x'.repeat(4001) })).toThrow('Invalid question');
    expect(() => parseAskSettings({})).toThrow('Invalid question');
  });
});

describe('chatbot guards', () => {
  it('is administrator-only and rejects bad conversation ids', async () => {
    await expect(loadChatStatus(as('lecturer'))).rejects.toThrow('Forbidden');
    await expect(loadConversations(as('rectorat'))).rejects.toThrow('Forbidden');
    await expect(loadConversation(as('student'), ID)).rejects.toThrow('Forbidden');
    await expect(removeConversation(as('student'), ID)).rejects.toThrow('Forbidden');
    await expect(loadConversation(as('administrator'), 'x')).rejects.toThrow('Not found');
    await expect(removeConversation(as('administrator'), 'x')).rejects.toThrow('Not found');
  });
});

describe('model, feedback and retrieval', () => {
  it('forwards a well-formed model id and drops anything else', () => {
    expect(parseAskSettings({ question: 'q', model: 'qwen2.5-3b-instruct' }).model).toBe('qwen2.5-3b-instruct');
    expect(parseAskSettings({ question: 'q', model: 'org/model:q4_k' }).model).toBe('org/model:q4_k');
    expect(parseAskSettings({ question: 'q', model: 'has space' })).not.toHaveProperty('model');
    expect(parseAskSettings({ question: 'q', model: '../../etc' })).not.toHaveProperty('model');
    expect(parseAskSettings({ question: 'q', model: 5 })).not.toHaveProperty('model');
  });
  it('feedback and retrieval are administrator-only and validated before any request', async () => {
    await expect(sendFeedback(as('student'), ID, 1, '')).rejects.toThrow('Forbidden');
    await expect(retrieveChunks(as('rectorat'), { question: 'q' })).rejects.toThrow('Forbidden');
    await expect(sendFeedback(as('administrator'), 'x', 1, '')).rejects.toThrow('Invalid feedback');
    await expect(sendFeedback(as('administrator'), ID, 2, '')).rejects.toThrow('Invalid feedback');
    await expect(retrieveChunks(as('administrator'), { question: ' ' })).rejects.toThrow('Invalid question');
  });
});
