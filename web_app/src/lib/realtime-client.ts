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

/** An attendance change in the open meeting (a student scanned the QR, or another device edited). */
export type MeetingEvent =
  | { kind: 'attendance'; studentId: string; attendTypeId: string | null; method: 'manual' | 'qr' | null }
  | { kind: 'resync' };

export function parseMeetingMessage(raw: string): MeetingEvent | null {
  let msg: { channel?: unknown; data?: Record<string, unknown> };
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  const d = msg.data ?? {};
  if (typeof msg.channel !== 'string' || !msg.channel.startsWith('meeting:')) return null;
  if (d.type !== 'attendance_changed' || typeof d.student_id !== 'string') return null;
  return {
    kind: 'attendance',
    studentId: d.student_id,
    attendTypeId: typeof d.attend_type_id === 'string' ? d.attend_type_id : null,
    method: d.method === 'qr' || d.method === 'manual' ? d.method : null,
  };
}

export function openMeetingFeed(
  meetingId: string,
  handlers: { onEvent(e: MeetingEvent): void; onStatus(live: boolean): void },
  EventSourceImpl: typeof EventSource | undefined = typeof EventSource === 'undefined' ? undefined : EventSource,
): Feed {
  if (!EventSourceImpl) return { close() {} };
  const source = new EventSourceImpl(`/api/realtime/meeting/${encodeURIComponent(meetingId)}`);
  let gap = false;
  source.addEventListener('ready', () => {
    handlers.onStatus(true);
    if (gap) {
      gap = false;
      handlers.onEvent({ kind: 'resync' });
    }
  });
  source.addEventListener('message', (ev) => {
    const parsed = parseMeetingMessage((ev as MessageEvent).data);
    if (parsed) handlers.onEvent(parsed);
  });
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
