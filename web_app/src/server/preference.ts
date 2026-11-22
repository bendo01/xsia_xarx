// Application preference (LLM chatbot switch and backend). Administrator-only on the API too;
// this layer checks the role and validates the backend against what the server build offers.
import { markSafeError } from '@solidjs/web';

import { apiFetch } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';

export type LlmBackend = 'cpu' | 'cuda' | 'vulkan';
const BACKENDS: readonly LlmBackend[] = ['cpu', 'cuda', 'vulkan'];

export interface ApplicationPreference {
  is_llm_enable: boolean;
  llm_backend: LlmBackend;
  /** Backends the server build contains. */
  available_backends: LlmBackend[];
}

/** Normalise an API answer: unknown backends are dropped, a missing backend falls back to cpu. */
export function normalisePreference(raw: Record<string, any> | null | undefined): ApplicationPreference {
  const available = (Array.isArray(raw?.available_backends) ? raw!.available_backends : ['cpu']).filter((b: unknown): b is LlmBackend => BACKENDS.includes(b as LlmBackend));
  const backend = BACKENDS.includes(raw?.llm_backend) ? (raw!.llm_backend as LlmBackend) : 'cpu';
  return { is_llm_enable: raw?.is_llm_enable === true, llm_backend: backend, available_backends: available.length ? available : ['cpu'] };
}

export async function loadApplicationPreference(auth: AuthState): Promise<ApplicationPreference> {
  requireAdministrator(auth);
  return normalisePreference(await apiFetch<Record<string, any>>('preference/application'));
}

export async function saveApplicationPreference(auth: AuthState, input: { is_llm_enable?: unknown; llm_backend?: unknown }): Promise<ApplicationPreference> {
  requireAdministrator(auth);
  const current = await loadApplicationPreference(auth);
  const backend = input.llm_backend as LlmBackend;
  if (!current.available_backends.includes(backend)) throw markSafeError(new Error('Invalid backend'));
  const saved = await apiFetch<Record<string, any>>('preference/application', { method: 'PUT', body: { is_llm_enable: input.is_llm_enable === true, llm_backend: backend } });
  return normalisePreference(saved);
}
