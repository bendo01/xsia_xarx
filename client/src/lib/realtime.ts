import { getStorageItem } from '~/lib/storage';

export interface RealtimeEvent {
    channel: string;
    data: Record<string, any>;
}

export interface RealtimeOptions {
    onEvent: (event: RealtimeEvent) => void;
    onStatusChange?: (connected: boolean) => void;
}

export interface RealtimeConnection {
    subscribe: (channels: string[]) => void;
    close: () => void;
}

const PING_INTERVAL_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

/**
 * Authenticated WebSocket client with auto-reconnect and re-subscription.
 * Returns a no-op connection during SSR or when no URL/token is available.
 */
export function createRealtime(
    initialChannels: string[],
    options: RealtimeOptions
): RealtimeConnection {
    const noop: RealtimeConnection = { subscribe: () => {}, close: () => {} };
    if (typeof window === 'undefined') return noop;

    const baseUrl = import.meta.env.VITE_WEB_SOCKET_SERVER_URL as string | undefined;
    if (!baseUrl) return noop;

    const channels = new Set(initialChannels);
    let socket: WebSocket | null = null;
    let closed = false;
    let attempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let pingTimer: ReturnType<typeof setInterval> | undefined;

    const send = (payload: unknown) => {
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
    };

    const connect = () => {
        const token = getStorageItem('token');
        if (closed || !token) return;

        const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`;
        socket = new WebSocket(url);

        socket.onopen = () => {
            attempt = 0;
            options.onStatusChange?.(true);
            channels.forEach((channel) => send({ action: 'subscribe', channel }));
            pingTimer = setInterval(() => send({ action: 'ping' }), PING_INTERVAL_MS);
        };

        socket.onmessage = (msg) => {
            try {
                const parsed = JSON.parse(msg.data);
                if (parsed?.event === 'message' && parsed.channel) {
                    options.onEvent({ channel: parsed.channel, data: parsed.data ?? {} });
                }
            } catch {
                // ignore non-JSON frames
            }
        };

        socket.onclose = () => {
            clearInterval(pingTimer);
            options.onStatusChange?.(false);
            if (closed) return;
            const delay = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** attempt++);
            reconnectTimer = setTimeout(connect, delay);
        };

        socket.onerror = () => socket?.close();
    };

    connect();

    return {
        subscribe(next) {
            next.forEach((channel) => {
                if (!channels.has(channel)) {
                    channels.add(channel);
                    send({ action: 'subscribe', channel });
                }
            });
        },
        close() {
            closed = true;
            clearTimeout(reconnectTimer);
            clearInterval(pingTimer);
            socket?.close();
        }
    };
}
