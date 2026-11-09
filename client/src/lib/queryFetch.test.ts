import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryFetch, resetQuerySupport } from './queryFetch';

describe('queryFetch', () => {
    const fetchMock = vi.fn();
    beforeEach(() => {
        resetQuerySupport();
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it('sends GET with a query string as QUERY with a JSON body', async () => {
        fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));
        await queryFetch('http://x/api/items?page=2&page_size=10&search=a%20b', { method: 'GET', headers: { A: '1' } });
        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('http://x/api/items');
        expect(init.method).toBe('QUERY');
        expect(JSON.parse(init.body)).toEqual({ page: 2, page_size: 10, search: 'a b' });
    });

    it('falls back to GET once and stops using QUERY when unsupported', async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 405 })).mockResolvedValue(new Response('{}'));
        await queryFetch('http://x/a?page=1');
        expect(fetchMock.mock.calls[1][0]).toBe('http://x/a?page=1');
        expect(fetchMock.mock.calls[1][1].method).toBeUndefined();
        await queryFetch('http://x/b?page=1');
        expect(fetchMock.mock.calls[2][1]?.method).toBeUndefined();
    });

    it('falls back on network/CORS TypeError', async () => {
        fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(new Response('{}'));
        await queryFetch('http://x/a?page=1');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('leaves non-GET and query-less requests untouched', async () => {
        fetchMock.mockResolvedValue(new Response('{}'));
        await queryFetch('http://x/a?page=1', { method: 'POST', body: '{}' });
        await queryFetch('http://x/a');
        expect(fetchMock.mock.calls[0][1].method).toBe('POST');
        expect(fetchMock.mock.calls[1][0]).toBe('http://x/a');
    });
});
