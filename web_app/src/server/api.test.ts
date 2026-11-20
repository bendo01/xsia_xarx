import { afterEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
  process.env.API_SERVER_URL = 'http://api.test/api/v1/';
});

import { ApiError, apiFetch, buildApiUrl, errorMessage } from './api';

afterEach(() => vi.unstubAllGlobals());

describe('buildApiUrl', () => {
  it('joins without double slashes and skips empty query values', () => {
    expect(buildApiUrl('/user', { page: 2, name: '', x: undefined })).toBe(
      'http://api.test/api/v1/user?page=2',
    );
  });
});

describe('errorMessage', () => {
  it('prefers brief, then message, then detail, then the fallback', () => {
    expect(errorMessage({ brief: 'b', message: 'm' }, 'f')).toBe('b');
    expect(errorMessage({ message: 'm' }, 'f')).toBe('m');
    expect(errorMessage({ error: { detail: 'd' } }, 'f')).toBe('d');
    expect(errorMessage(null, 'f')).toBe('f');
  });
});

describe('apiFetch (unauthenticated calls)', () => {
  it('POSTs JSON and parses the response', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ token: 't' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const out = await apiFetch<{ token: string }>('login', {
      auth: false,
      body: { email: 'a@b.c', password: 'p' },
    });
    expect(out.token).toBe('t');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/login');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('turns 4xx into an ApiError carrying the API message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ brief: 'Invalid email or password' }), { status: 401 })),
    );
    await expect(apiFetch('login', { auth: false, body: {} })).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'Invalid email or password',
    });
  });

  it('hides the internal URL when the API is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connect ECONNREFUSED http://api.test'); }));
    const err = (await apiFetch('x', { auth: false }).catch((e: unknown) => e)) as Error;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toBe('Cannot reach the API server');
  });
});
