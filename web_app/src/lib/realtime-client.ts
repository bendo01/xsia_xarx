// Browser side of the realtime feed: an EventSource on /api/realtime/enrollment/<id>
// (the web app holds the WebSocket, see src/server/realtime.ts) turned into a
// few typed events the enrollment page can act on.

export type FeedEvent =
  /** A class's seat count changed. */
  | { kind: 'seat'; teachId: string; enrolled: number; max: number | null }
  /** The student's own study plan changed (possibly from another tab or device). */
  | { kind: 'plan' }
  /** The connection came back after a gap: events may have been missed. */
  | { kind: 'resync' };

/** One SSE `message` payload (`{channel, data}`) -> a typed event, or null for anything unrecognised. */
export function parseFeedMessage(raw: string): FeedEvent | null {
  let msg: { channel?: unknown; data?: Record<string, unknown> };
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  const channel = typeof msg.channel === 'string' ? msg.channel : '';
  const data = msg.data ?? {};

  if (channel.startsWith('teach:') && data.type === 'seat_changed' && typeof data.enrolled_count === 'number') {
    const teachId = typeof data.teach_id === 'string' ? data.teach_id : channel.slice('teach:'.length);
    return { kind: 'seat', teachId, enrolled: data.enrolled_count, max: typeof data.max_member === 'number' ? data.max_member : null };
  }
  if (channel.startsWith('activity:') && data.type === 'detail_changed') return { kind: 'plan' };
  return null;
}

export interface Feed {
  close(): void;
}

export function openEnrollmentFeed(
  activityId: string,
  handlers: { onEvent(e: FeedEvent): void; onStatus(live: boolean): void },
  EventSourceImpl: typeof EventSource | undefined = typeof EventSource === 'undefined' ? undefined : EventSource,
): Feed {
  if (!EventSourceImpl) return { close() {} };

  const source = new EventSourceImpl(`/api/realtime/enrollment/${encodeURIComponent(activityId)}`);
  let gap = false; // true after a drop, so the next "ready" asks the page to resync

  source.addEventListener('ready', () => {
    handlers.onStatus(true);
    if (gap) {
      gap = false;
      handlers.onEvent({ kind: 'resync' });
    }
  });
  source.addEventListener('message', (ev) => {
    const parsed = parseFeedMessage((ev as MessageEvent).data);
    if (parsed) handlers.onEvent(parsed);
  });
  // EventSource retries by itself (the server sets retry: 3000); we only report it.
  source.onerror = () => {
    gap = true;
    handlers.onStatus(false);
  };

  return {
    close() {
      source.close();
      handlers.onStatus(false);
    },
  };
}
