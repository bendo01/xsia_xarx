import { describe, expect, it } from 'vitest';

import { openEnrollmentFeed, parseMeetingMessage, parseFeedMessage, type FeedEvent } from './realtime-client';

const T = '123e4567-e89b-42d3-a456-426614174011';

describe('parseFeedMessage', () => {
  it('reads a seat change, taking the id from the payload (or the channel)', () => {
    expect(parseFeedMessage(JSON.stringify({ channel: `teach:${T}`, data: { type: 'seat_changed', teach_id: T, enrolled_count: 9, max_member: 40 } })))
      .toEqual({ kind: 'seat', teachId: T, enrolled: 9, max: 40 });
    expect(parseFeedMessage(JSON.stringify({ channel: `teach:${T}`, data: { type: 'seat_changed', enrolled_count: 0, max_member: null } })))
      .toEqual({ kind: 'seat', teachId: T, enrolled: 0, max: null });
  });
  it('reads a plan change', () => {
    expect(parseFeedMessage(JSON.stringify({ channel: 'activity:a1', data: { type: 'detail_changed', action: 'create' } }))).toEqual({ kind: 'plan' });
  });
  it('ignores anything else without throwing', () => {
    for (const raw of ['not json', '{}', JSON.stringify({ channel: 'teach:x', data: { type: 'other' } }), JSON.stringify({ channel: 'teach:x', data: { type: 'seat_changed', enrolled_count: '9' } }), JSON.stringify({ channel: 'meeting:x', data: { type: 'detail_changed' } })]) {
      expect(parseFeedMessage(raw)).toBeNull();
    }
  });
});

class FakeEventSource {
  static last: FakeEventSource;
  listeners: Record<string, ((ev: unknown) => void)[]> = {};
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) { FakeEventSource.last = this; }
  addEventListener(name: string, fn: (ev: unknown) => void) { (this.listeners[name] ??= []).push(fn); }
  emit(name: string, data?: unknown) { this.listeners[name]?.forEach((f) => f({ data })); }
  close() { this.closed = true; }
}

describe('openEnrollmentFeed', () => {
  const setup = () => {
    const events: FeedEvent[] = [];
    const status: boolean[] = [];
    const feed = openEnrollmentFeed('act/1', { onEvent: (e) => events.push(e), onStatus: (s) => status.push(s) }, FakeEventSource as unknown as typeof EventSource);
    return { events, status, feed, es: FakeEventSource.last };
  };

  it('connects to the encoded relay URL and reports live on ready', () => {
    const { es, status } = setup();
    expect(es.url).toBe('/api/realtime/enrollment/act%2F1');
    es.emit('ready');
    expect(status).toEqual([true]);
  });
  it('delivers parsed events and skips junk', () => {
    const { es, events } = setup();
    es.emit('message', JSON.stringify({ channel: `teach:${T}`, data: { type: 'seat_changed', enrolled_count: 3, max_member: 10 } }));
    es.emit('message', 'garbage');
    expect(events).toEqual([{ kind: 'seat', teachId: T, enrolled: 3, max: 10 }]);
  });
  it('asks for a resync only when it comes back after a drop', () => {
    const { es, events, status } = setup();
    es.emit('ready');
    expect(events).toEqual([]); // first connect: nothing missed
    es.onerror?.();
    es.emit('ready');
    expect(events).toEqual([{ kind: 'resync' }]);
    expect(status).toEqual([true, false, true]);
    es.emit('ready');
    expect(events).toHaveLength(1); // not again without another drop
  });
  it('closes the source and reports offline', () => {
    const { feed, es, status } = setup();
    feed.close();
    expect(es.closed).toBe(true);
    expect(status.at(-1)).toBe(false);
  });
  it('is a harmless no-op where EventSource does not exist', () => {
    const feed = openEnrollmentFeed('a', { onEvent() {}, onStatus() {} }, undefined);
    expect(() => feed.close()).not.toThrow();
  });
});

describe('parseMeetingMessage', () => {
  const M = '11111111-1111-4111-8111-111111111111';
  it('reads an attendance change', () => {
    const raw = JSON.stringify({ channel: `meeting:${M}`, data: { type: 'attendance_changed', student_id: 's1', attend_type_id: 'a1', method: 'qr' } });
    expect(parseMeetingMessage(raw)).toEqual({ kind: 'attendance', studentId: 's1', attendTypeId: 'a1', method: 'qr' });
  });
  it('ignores other channels, types and junk', () => {
    expect(parseMeetingMessage(JSON.stringify({ channel: `teach:${M}`, data: { type: 'attendance_changed', student_id: 's' } }))).toBeNull();
    expect(parseMeetingMessage(JSON.stringify({ channel: `meeting:${M}`, data: { type: 'x' } }))).toBeNull();
    expect(parseMeetingMessage('nope')).toBeNull();
  });
});
