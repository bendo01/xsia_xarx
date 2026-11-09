/**
 * fetch() replacement for list/index reads that uses the HTTP QUERY method.
 *
 * A GET request with a query string is sent as `QUERY <path>` with the parameters as a JSON body
 * (see server `QueryMethod` middleware). If the server, a proxy or CORS rejects QUERY, the request is
 * transparently retried as the original GET and QUERY is skipped for the rest of the session.
 */
let queryUnsupported = false;

const FALLBACK_STATUSES = [404, 405, 501];
const NUMERIC_KEYS = new Set(['page', 'page_size', 'per_page']);

export function resetQuerySupport(): void {
    queryUnsupported = false;
}

function paramsToBody(search: URLSearchParams): Record<string, string | number | string[]> {
    const body: Record<string, string | number | string[]> = {};
    search.forEach((value, key) => {
        if (key in body) {
            const prev = body[key];
            body[key] = Array.isArray(prev) ? [...prev, value] : [String(prev), value];
        } else {
            body[key] = NUMERIC_KEYS.has(key) && value !== '' && !Number.isNaN(Number(value)) ? Number(value) : value;
        }
    });
    return body;
}

export async function queryFetch(input: string, init: RequestInit = {}): Promise<Response> {
    const method = (init.method ?? 'GET').toUpperCase();
    const queryStart = input.indexOf('?');
    if (queryUnsupported || method !== 'GET' || init.body != null || queryStart === -1) {
        return fetch(input, init);
    }

    const path = input.slice(0, queryStart);
    const search = new URLSearchParams(input.slice(queryStart + 1));
    if ([...search.keys()].length === 0) {
        return fetch(path, init);
    }

    try {
        const res = await fetch(path, { ...init, method: 'QUERY', body: JSON.stringify(paramsToBody(search)) });
        if (FALLBACK_STATUSES.includes(res.status)) {
            if (res.status !== 404) queryUnsupported = true;
            return fetch(input, init);
        }
        return res;
    } catch (error) {
        if (error instanceof TypeError) {
            queryUnsupported = true;
            return fetch(input, init);
        }
        throw error;
    }
}
