// The ONE client for the Rust API, server-side only. Every server function
// goes through apiFetch: it injects the Bearer token from the session cookie
// (the browser never holds it), normalises errors, and drops a dead session on
// 401. Replaces the per-file fetch/getHeaders blocks of client/src/controllers.
import { markSafeError } from '@solidjs/web';
import { env } from 'virtual:solid-env/server';

import type { ApiPage, Paginated, PaginationQuery } from '../lib/types';
import { clearSession, getSession } from './session';

export class ApiError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  /** Send the session token (default true). Login endpoints pass false. */
  auth?: boolean;
  /** Use this token instead of the session's (for the request that is creating the session). */
  token?: string;
}

export function buildApiUrl(path: string, query?: Query): string {
  const base = env.API_SERVER_URL.replace(/\/+$/, '');
  const url = new URL(`${base}/${path.replace(/^\/+/, '')}`);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/** Pulls the human message out of a Salvo error body (`brief`/`detail`). */
export function errorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, unknown>;
    for (const key of ['brief', 'message', 'detail']) {
      if (typeof b[key] === 'string' && b[key]) return b[key] as string;
    }
    const nested = b.error;
    if (nested && typeof nested === 'object') return errorMessage(nested, fallback);
  }
  return fallback;
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: ApiOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  // A FormData body sets its own multipart boundary header.
  if (opts.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  const wantsAuth = opts.auth !== false;
  if (wantsAuth) {
    const token = opts.token ?? (await getSession())?.token;
    if (!token) throw markSafeError(new ApiError(401, 'Not signed in'));
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(buildApiUrl(path, opts.query), {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    });
  } catch {
    // Network failure: never leak the internal URL.
    throw new ApiError(502, 'Cannot reach the API server');
  }

  const text = await res.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = undefined;
    }
  }

  if (!res.ok) {
    if (res.status === 401 && wantsAuth) await clearSession();
    const message = errorMessage(json, `Request failed (${res.status})`);
    const err = new ApiError(res.status, message);
    // 4xx messages are intentional, client-facing content; 5xx stay masked.
    throw res.status < 500 ? markSafeError(err) : err;
  }
  return json as T;
}

/**
 * Like apiFetch but hands back the raw Response (for streaming files). Always
 * authenticated; throws ApiError for non-2xx so callers can map status codes.
 */
export async function apiFetchRaw(path: string, opts: { query?: Query; accept?: string } = {}): Promise<Response> {
  const token = (await getSession())?.token;
  if (!token) throw markSafeError(new ApiError(401, 'Not signed in'));
  let res: Response;
  try {
    res = await fetch(buildApiUrl(path, opts.query), {
      headers: { Accept: opts.accept ?? '*/*', Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ApiError(502, 'Cannot reach the API server');
  }
  if (!res.ok) {
    if (res.status === 401) await clearSession();
    throw new ApiError(res.status, `Request failed (${res.status})`);
  }
  return res;
}

/** GET a list endpoint and map the API envelope onto the UI's pagination shape. */
export async function apiPaginated<T>(
  path: string,
  q: PaginationQuery = {},
  /** Which query parameter carries the search text (endpoints differ: `name`, `search`). */
  opts: { searchParam?: string } = {},
): Promise<Paginated<T>> {
  const { page, per_page, search, sort_by, sort_dir, ...filters } = q;
  const res = await apiFetch<ApiPage<T> | T[]>(path, {
    query: {
      page,
      page_size: per_page,
      [opts.searchParam ?? 'name']: search,
      sort_by,
      sort_dir,
      ...filters,
    },
  });
  const data = Array.isArray(res) ? res : (res.data ?? []);
  const meta: Partial<ApiPage<T>> = Array.isArray(res) ? {} : res;
  return {
    data,
    pagination: {
      page: meta.page ?? page ?? 1,
      per_page: meta.page_size ?? per_page ?? 10,
      total_page: meta.total_pages ?? 1,
      total_data: meta.total ?? data.length,
    },
  };
}
