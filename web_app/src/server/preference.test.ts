import { describe, expect, it } from 'vitest';

import type { AuthState } from './auth';
import { loadApplicationPreference, normalisePreference, saveApplicationPreference } from './preference';

const as = (activeRole: string) => ({ activeRole }) as AuthState;

describe('normalisePreference', () => {
  it('keeps known backends and falls back to cpu', () => {
    expect(normalisePreference({ is_llm_enable: true, llm_backend: 'cuda', available_backends: ['cpu', 'cuda', 'rocm'] })).toEqual({ is_llm_enable: true, llm_backend: 'cuda', available_backends: ['cpu', 'cuda'] });
    expect(normalisePreference(null)).toEqual({ is_llm_enable: false, llm_backend: 'cpu', available_backends: ['cpu'] });
    expect(normalisePreference({ llm_backend: 'metal', available_backends: [] }).llm_backend).toBe('cpu');
  });
});

describe('application preference guards', () => {
  it('is administrator-only', async () => {
    await expect(loadApplicationPreference(as('rectorat'))).rejects.toThrow('Forbidden');
    await expect(saveApplicationPreference(as('student'), { llm_backend: 'cpu' })).rejects.toThrow('Forbidden');
  });
});
