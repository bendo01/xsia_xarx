// Realtime relay: the browser cannot hold the API's JWT (it lives only in the
// httpOnly session cookie), and the Rust WebSocket wants that JWT in its URL.
// So the web app opens the WebSocket itself and forwards just the events the
// page needs to the browser as Server-Sent Events. EventSource reconnects on
// its own, so when the upstream socket closes we simply end the stream.

/** The slice of the WebSocket API the relay uses (so tests can pass a fake). */
type SocketLike = {
  send(data: string): void;
  close(): void;
  readyState: number;
  onopen: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: unknown }) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onerror: ((ev: unknown) => void) | null;
};

export interface RelayOptions {
  /** Full upstream URL, token included. */
  url: string;
  /** Channels to subscribe to; events on any other channel are dropped. */
  channels: string[];
  /** Injectable for tests. */
  WebSocketImpl?: new (url: string) => SocketLike;
  /** Keep-alive ping to the API (it drops idle sockets). */
  pingMs?: number;
  /** SSE comment line so proxies do not close an idle stream. */
  heartbeatMs?: number;
  /** The request's abort signal: the browser went away. */
  signal?: AbortSignal;
}

/** `http://host/api/v1` -> `ws://host/api/v1/realtime/ws?token=...` */
export function toWsUrl(apiUrl: string, token: string): string {
  const u = new URL(`${apiUrl.replace(/\/+$/, '')}/realtime/ws`);
  u.protocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
  u.searchParams.set('token', token);
  return u.toString();
}

const OPEN = 1;
const encoder = new TextEncoder();
const sse = (event: string, data: unknown) => encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

export function createRelayStream(o: RelayOptions): ReadableStream<Uint8Array> {
  const WS = o.WebSocketImpl ?? (globalThis.WebSocket as unknown as new (url: string) => SocketLike);
  const allowed = new Set(o.channels);
  let socket: SocketLike | null = null;
  let ping: ReturnType<typeof setInterval> | undefined;
  let beat: ReturnType<typeof setInterval> | undefined;
  let ctl: ReadableStreamDefaultController<Uint8Array> | null = null;
  let done = false;

  const finish = (closeStream: boolean) => {
    if (done) return;
    done = true;
    clearInterval(ping);
    clearInterval(beat);
    try { socket?.close(); } catch { /* already closed */ }
    if (closeStream) { try { ctl?.close(); } catch { /* already closed */ } }
  };
  const push = (chunk: Uint8Array) => { if (!done) { try { ctl?.enqueue(chunk); } catch { finish(false); } } };

  return new ReadableStream<Uint8Array>({
    start(controller) {
      ctl = controller;
      // Tell EventSource how long to wait before it reconnects.
      push(encoder.encode('retry: 3000\n\n'));
      o.signal?.addEventListener('abort', () => finish(true), { once: true });
      if (o.signal?.aborted) return finish(true);

      try {
        socket = new WS(o.url);
      } catch {
        return finish(true);
      }
      socket.onopen = () => {
        for (const channel of allowed) socket?.send(JSON.stringify({ action: 'subscribe', channel }));
        push(sse('ready', {}));
        ping = setInterval(() => { if (socket?.readyState === OPEN) socket.send(JSON.stringify({ action: 'ping' })); }, o.pingMs ?? 25_000);
        beat = setInterval(() => push(encoder.encode(': keepalive\n\n')), o.heartbeatMs ?? 20_000);
      };
      socket.onmessage = (ev) => {
        try {
          const msg = JSON.parse(String(ev.data));
          if (msg?.event === 'message' && typeof msg.channel === 'string' && allowed.has(msg.channel)) {
            push(sse('message', { channel: msg.channel, data: msg.data ?? {} }));
          }
        } catch {
          /* non-JSON frame (pong, etc.) */
        }
      };
      socket.onclose = () => finish(true);
      socket.onerror = () => finish(true);
    },
    cancel() {
      finish(false);
    },
  });
}
