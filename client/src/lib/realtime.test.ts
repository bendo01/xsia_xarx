import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('~/lib/storage', () => ({ getStorageItem: () => 'tok en' }));

class FakeSocket {
    static OPEN = 1;
    static instances: FakeSocket[] = [];
    readyState = 1;
    sent: string[] = [];
    onopen: (() => void) | null = null;
    onmessage: ((m: { data: string }) => void) | null = null;
    onclose: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public url: string) {
        FakeSocket.instances.push(this);
    }
    send(d: string) {
        this.sent.push(d);
    }
    close() {
        this.onclose?.();
    }
}

describe('createRealtime', () => {
    beforeEach(() => {
        FakeSocket.instances = [];
        vi.stubGlobal('WebSocket', FakeSocket);
        vi.stubEnv('VITE_WEB_SOCKET_SERVER_URL', 'ws://x/ws');
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
    });

    it('connects with encoded token, subscribes, and dispatches events', async () => {
        const { createRealtime } = await import('./realtime');
        const onEvent = vi.fn();
        const conn = createRealtime(['teach:1'], { onEvent });
        const sock = FakeSocket.instances[0];
        expect(sock.url).toBe('ws://x/ws?token=tok%20en');

        sock.onopen?.();
        expect(JSON.parse(sock.sent[0])).toEqual({ action: 'subscribe', channel: 'teach:1' });

        sock.onmessage?.({ data: JSON.stringify({ event: 'message', channel: 'teach:1', data: { a: 1 } }) });
        expect(onEvent).toHaveBeenCalledWith({ channel: 'teach:1', data: { a: 1 } });
        conn.close();
    });

    it('reconnects after close and stops after close()', async () => {
        const { createRealtime } = await import('./realtime');
        const conn = createRealtime([], { onEvent: vi.fn() });
        FakeSocket.instances[0].onclose?.();
        vi.advanceTimersByTime(1000);
        expect(FakeSocket.instances.length).toBe(2);
        conn.close();
        vi.advanceTimersByTime(60000);
        expect(FakeSocket.instances.length).toBe(2);
    });
});
