import { afterEach, describe, expect, it, vi } from 'vitest';

import { createRelayStream, toWsUrl } from './realtime';

class FakeSocket {
  static last: FakeSocket;
  readyState = 0;
  sent: string[] = [];
  closed = false;
  onopen: ((ev: unknown) => void) | null = null;
  onmessage: ((ev: { data: unknown }) => void) | null = null;
  onclose: ((ev: unknown) => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  constructor(public url: string) { FakeSocket.last = this; }
  send(d: string) { this.sent.push(d); }
  close() { this.closed = true; this.readyState = 3; }
  open() { this.readyState = 1; this.onopen?.({}); }
  message(o: unknown) { this.onmessage?.({ data: typeof o === 'string' ? o : JSON.stringify(o) }); }
}

const T1 = 'teach:123e4567-e89b-42d3-a456-426614174011';
const A1 = 'activity:123e4567-e89b-42d3-a456-426614174001';

/** Read whatever the stream has produced so far (without waiting for it to end). */
async function drain(reader: ReadableStreamDefaultReader<Uint8Array>, n: number) {
  const dec = new TextDecoder();
  let out = '';
  for (let i = 0; i < n; i++) out += dec.decode((await reader.read()).value);
  return out;
}

afterEach(() => vi.useRealTimers());

describe('toWsUrl', () => {
  it('maps http(s) to ws(s) and appends the realtime path and token', () => {
    expect(toWsUrl('http://127.0.0.1:5800/api/v1', 'a.b.c')).toBe('ws://127.0.0.1:5800/api/v1/realtime/ws?token=a.b.c');
    expect(toWsUrl('https://api.example.id/api/v1/', 't')).toBe('wss://api.example.id/api/v1/realtime/ws?token=t');
  });
  it('encodes a token that needs it', () => {
    expect(toWsUrl('http://h/api/v1', 'a b&c')).toContain('token=a+b%26c');
  });
});

describe('createRelayStream', () => {
  const make = (extra = {}) => createRelayStream({ url: 'ws://x/ws?token=t', channels: [T1, A1], WebSocketImpl: FakeSocket, ...extra });

  it('subscribes to every channel once the upstream socket opens, then says ready', async () => {
    const r = make().getReader();
    FakeSocket.last.open();
    const text = await drain(r, 2); // retry line + ready
    expect(text).toContain('retry: 3000');
    expect(text).toContain('event: ready');
    expect(FakeSocket.last.sent.map((s) => JSON.parse(s))).toEqual([
      { action: 'subscribe', channel: T1 },
      { action: 'subscribe', channel: A1 },
    ]);
  });

  it('forwards messages on subscribed channels as SSE events', async () => {
    const r = make().getReader();
    FakeSocket.last.open();
    await drain(r, 2);
    FakeSocket.last.message({ event: 'message', channel: T1, data: { type: 'seat_changed', teach_id: 'x', enrolled_count: 7, max_member: 40 } });
    const text = await drain(r, 1);
    expect(text).toContain('event: message');
    expect(JSON.parse(text.split('data: ')[1])).toEqual({ channel: T1, data: { type: 'seat_changed', teach_id: 'x', enrolled_count: 7, max_member: 40 } });
  });

  it('drops other channels, non-message events, errors and junk frames', async () => {
    const r = make().getReader();
    FakeSocket.last.open();
    await drain(r, 2);
    FakeSocket.last.message({ event: 'message', channel: 'teach:someone-elses', data: {} });
    FakeSocket.last.message({ event: 'error', message: 'Not authorized' });
    FakeSocket.last.message({ event: 'echo', text: 'PONG' });
    FakeSocket.last.message('not json');
    FakeSocket.last.message({ event: 'message', channel: A1, data: { type: 'detail_changed' } }); // the only one that should pass
    const text = await drain(r, 1);
    expect(text).toContain(A1);
    expect(text).not.toContain('someone-elses');
  });

  it('ends the stream (so EventSource reconnects) when the upstream socket closes', async () => {
    const r = make().getReader();
    FakeSocket.last.open();
    await drain(r, 2);
    FakeSocket.last.onclose?.({});
    expect((await r.read()).done).toBe(true);
  });

  it('closes the upstream socket when the browser cancels', async () => {
    const r = make().getReader();
    FakeSocket.last.open();
    await r.cancel();
    expect(FakeSocket.last.closed).toBe(true);
  });

  it('closes the upstream socket when the request is aborted', async () => {
    const ac = new AbortController();
    const r = make({ signal: ac.signal }).getReader();
    FakeSocket.last.open();
    ac.abort();
    expect(FakeSocket.last.closed).toBe(true);
    // Chunks queued before the abort are still delivered; then the stream must end.
    let reads = 0;
    while (!(await r.read()).done) expect(++reads).toBeLessThan(10);
  });

  it('pings the API and sends keepalive comments while idle, and stops after close', async () => {
    vi.useFakeTimers();
    const r = make({ pingMs: 1000, heartbeatMs: 500 }).getReader();
    FakeSocket.last.open();
    vi.advanceTimersByTime(1000);
    expect(FakeSocket.last.sent.filter((s) => s.includes('ping'))).toHaveLength(1);
    const text = await drain(r, 4); // retry, ready, 2x keepalive
    expect(text).toContain(': keepalive');
    await r.cancel();
    const pings = FakeSocket.last.sent.length;
    vi.advanceTimersByTime(10_000);
    expect(FakeSocket.last.sent.length).toBe(pings); // timers cleared
  });

  it('ends cleanly if the socket cannot even be created', async () => {
    const Broken = class { constructor() { throw new Error('bad url'); } } as unknown as typeof FakeSocket;
    const r = createRelayStream({ url: 'x', channels: [], WebSocketImpl: Broken }).getReader();
    await r.read(); // retry line
    expect((await r.read()).done).toBe(true);
  });
});
